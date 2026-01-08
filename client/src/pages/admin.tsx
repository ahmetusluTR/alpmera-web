import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Shield, 
  ArrowRight, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Clock,
  FileText,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign, Commitment, AdminActionLog, CampaignState } from "@shared/schema";

interface CampaignWithStats extends Campaign {
  participantCount: number;
  totalCommitted: number;
}

interface StateMachineResponse {
  validTransitions: Record<CampaignState, CampaignState[]>;
}

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-chart-1 text-white",
  SUCCESS: "bg-green-600 dark:bg-green-700 text-white",
  FAILED: "bg-destructive text-destructive-foreground",
  FULFILLMENT: "bg-amber-600 dark:bg-amber-700 text-white",
  RELEASED: "bg-green-700 dark:bg-green-800 text-white",
};

function getAdminIdempotencyKey(action: "refund" | "release", campaignId: string): string {
  const storageKey = `admin-idem-${action}-${campaignId}`;
  let existingKey = sessionStorage.getItem(storageKey);
  if (!existingKey) {
    existingKey = crypto.randomUUID();
    sessionStorage.setItem(storageKey, existingKey);
  }
  return existingKey;
}

function clearAdminIdempotencyKey(action: "refund" | "release", campaignId: string): void {
  const storageKey = `admin-idem-${action}-${campaignId}`;
  sessionStorage.removeItem(storageKey);
}

// Fallback transitions in case server is unavailable
const FALLBACK_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  AGGREGATION: ["SUCCESS", "FAILED"],
  SUCCESS: ["FULFILLMENT", "FAILED"],
  FAILED: [],
  FULFILLMENT: ["RELEASED", "FAILED"],
  RELEASED: [],
};

export default function AdminConsole() {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [targetState, setTargetState] = useState<CampaignState | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");
  
  // Create campaign form state
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [newCampaignRules, setNewCampaignRules] = useState("");
  const [newCampaignImageUrl, setNewCampaignImageUrl] = useState("");
  const [newCampaignTargetAmount, setNewCampaignTargetAmount] = useState("");
  const [newCampaignUnitPrice, setNewCampaignUnitPrice] = useState("");
  const [newCampaignDeadline, setNewCampaignDeadline] = useState("");

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignWithStats[]>({
    queryKey: ["/api/campaigns"],
  });

  // Fetch state machine from server to prevent frontend/backend drift
  const { data: stateMachine } = useQuery<StateMachineResponse>({
    queryKey: ["/api/state-machine"],
  });

  // Use server-provided transitions with fallback
  const validTransitions = stateMachine?.validTransitions ?? FALLBACK_TRANSITIONS;

  const { data: selectedCampaign } = useQuery<CampaignWithStats>({
    queryKey: ["/api/campaigns", selectedCampaignId],
    enabled: !!selectedCampaignId,
  });

  const { data: commitments } = useQuery<Commitment[]>({
    queryKey: ["/api/campaigns", selectedCampaignId, "commitments"],
    enabled: !!selectedCampaignId,
  });

  const { data: actionLogs } = useQuery<AdminActionLog[]>({
    queryKey: ["/api/admin/logs"],
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ campaignId, newState, reason }: { campaignId: string; newState: CampaignState; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
        newState,
        reason,
        adminUsername,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "State Transition Complete", description: "The campaign state has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      setTransitionDialogOpen(false);
      setTargetState(null);
      setTransitionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Transition Failed", description: error.message, variant: "destructive" });
    },
  });

  const processRefundsMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const idempotencyKey = getAdminIdempotencyKey("refund", campaignId);
      const response = await apiRequest("POST", `/api/admin/campaigns/${campaignId}/refund`, {
        adminUsername,
      }, {
        "x-idempotency-key": idempotencyKey,
      });
      return response.json();
    },
    onSuccess: (data, campaignId) => {
      const isIdempotent = data._idempotent === true;
      if (isIdempotent) {
        toast({ title: "Already Processed", description: "This refund was already processed. Showing existing result." });
      } else {
        toast({ title: "Refunds Processed", description: "All commitments have been refunded." });
      }
      clearAdminIdempotencyKey("refund", campaignId);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaignId, "commitments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Refund Failed", description: error.message, variant: "destructive" });
    },
  });

  const releasesFundsMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const idempotencyKey = getAdminIdempotencyKey("release", campaignId);
      const response = await apiRequest("POST", `/api/admin/campaigns/${campaignId}/release`, {
        adminUsername,
      }, {
        "x-idempotency-key": idempotencyKey,
      });
      return response.json();
    },
    onSuccess: (data, campaignId) => {
      const isIdempotent = data._idempotent === true;
      if (isIdempotent) {
        toast({ title: "Already Processed", description: "This release was already processed. Showing existing result." });
      } else {
        toast({ title: "Funds Released", description: "All commitments have been released." });
      }
      clearAdminIdempotencyKey("release", campaignId);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaignId, "commitments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Release Failed", description: error.message, variant: "destructive" });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/campaigns`, {
        adminUsername,
        title: newCampaignTitle,
        description: newCampaignDescription,
        rules: newCampaignRules,
        imageUrl: newCampaignImageUrl || null,
        targetAmount: newCampaignTargetAmount,
        unitPrice: newCampaignUnitPrice,
        minCommitment: newCampaignUnitPrice,
        aggregationDeadline: newCampaignDeadline,
      });
      return response.json();
    },
    onSuccess: (campaign) => {
      toast({ title: "Campaign Created", description: `Campaign "${campaign.title}" has been created in AGGREGATION state.` });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      setCreateCampaignDialogOpen(false);
      resetCreateCampaignForm();
      setSelectedCampaignId(campaign.id);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Create Campaign", description: error.message, variant: "destructive" });
    },
  });

  const resetCreateCampaignForm = () => {
    setNewCampaignTitle("");
    setNewCampaignDescription("");
    setNewCampaignRules("");
    setNewCampaignImageUrl("");
    setNewCampaignTargetAmount("");
    setNewCampaignUnitPrice("");
    setNewCampaignDeadline("");
  };

  const isCreateFormValid = () => {
    return (
      newCampaignTitle.trim() !== "" &&
      newCampaignRules.trim() !== "" &&
      parseFloat(newCampaignTargetAmount) > 0 &&
      parseFloat(newCampaignUnitPrice) > 0 &&
      newCampaignDeadline !== "" &&
      new Date(newCampaignDeadline) > new Date()
    );
  };

  const filteredCampaigns = campaigns?.filter(c => stateFilter === "all" || c.state === stateFilter) || [];

  const openTransitionDialog = (state: CampaignState) => {
    setTargetState(state);
    setTransitionDialogOpen(true);
  };

  const handleTransition = () => {
    if (selectedCampaignId && targetState) {
      transitionMutation.mutate({ campaignId: selectedCampaignId, newState: targetState, reason: transitionReason });
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="admin-title">
              <Shield className="w-6 h-6" />
              Admin Console
            </h1>
            <p className="text-muted-foreground">Manage campaigns, state transitions, and audit logs</p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="admin-name" className="text-sm text-muted-foreground">Admin:</Label>
            <Input 
              id="admin-name"
              value={adminUsername} 
              onChange={(e) => setAdminUsername(e.target.value)}
              className="w-40"
              data-testid="input-admin-name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <CardTitle className="text-base">Campaigns</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setCreateCampaignDialogOpen(true)}
                    data-testid="button-create-campaign"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create
                  </Button>
                </div>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger data-testid="select-state-filter">
                    <SelectValue placeholder="Filter by state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="AGGREGATION">Aggregation</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="FULFILLMENT">Fulfillment</SelectItem>
                    <SelectItem value="RELEASED">Released</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {campaignsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      No campaigns found
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredCampaigns.map(campaign => (
                        <button
                          key={campaign.id}
                          onClick={() => setSelectedCampaignId(campaign.id)}
                          className={`w-full p-4 text-left hover-elevate active-elevate-2 transition-colors ${
                            selectedCampaignId === campaign.id ? "bg-muted" : ""
                          }`}
                          data-testid={`button-campaign-${campaign.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{campaign.title}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                {campaign.participantCount}
                              </p>
                            </div>
                            <Badge className={`shrink-0 text-xs ${STATE_COLORS[campaign.state]}`}>
                              {campaign.state}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedCampaign ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle data-testid="selected-campaign-title">{selectedCampaign.title}</CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          ID: {selectedCampaign.id}
                        </CardDescription>
                      </div>
                      <Badge className={`text-sm ${STATE_COLORS[selectedCampaign.state]}`} data-testid="selected-campaign-state">
                        {selectedCampaign.state}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Participants</p>
                        <p className="text-xl font-mono font-semibold" data-testid="text-admin-participants">
                          {selectedCampaign.participantCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Committed</p>
                        <p className="text-xl font-mono font-semibold" data-testid="text-admin-committed">
                          {selectedCampaign.totalCommitted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="text-xl font-mono font-semibold">
                          {parseFloat(selectedCampaign.targetAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedCampaign.aggregationDeadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">State Transitions</h4>
                      <div className="flex flex-wrap gap-2">
                        {(validTransitions[selectedCampaign.state as CampaignState] ?? []).map(state => (
                          <Button 
                            key={state}
                            variant={state === "FAILED" ? "destructive" : "default"}
                            size="sm"
                            onClick={() => openTransitionDialog(state)}
                            data-testid={`button-transition-${state}`}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {state}
                          </Button>
                        ))}
                        {(validTransitions[selectedCampaign.state as CampaignState] ?? []).length === 0 && (
                          <p className="text-sm text-muted-foreground">No transitions available from this state.</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">Admin Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCampaign.state === "FAILED" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => processRefundsMutation.mutate(selectedCampaign.id)}
                            disabled={processRefundsMutation.isPending}
                            data-testid="button-process-refunds"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Process Refunds
                          </Button>
                        )}
                        {selectedCampaign.state === "RELEASED" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => releasesFundsMutation.mutate(selectedCampaign.id)}
                            disabled={releasesFundsMutation.isPending}
                            data-testid="button-release-funds"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Release All Funds
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Commitments ({commitments?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Participant</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commitments?.map(commitment => (
                            <TableRow key={commitment.id} data-testid={`row-commitment-${commitment.id}`}>
                              <TableCell className="font-mono text-xs">{commitment.referenceNumber}</TableCell>
                              <TableCell>{commitment.participantName}</TableCell>
                              <TableCell className="text-right font-mono">
                                {parseFloat(commitment.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                              </TableCell>
                              <TableCell className="text-right font-mono">{commitment.quantity}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {commitment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!commitments || commitments.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No commitments yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a campaign to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Audit Log
            </CardTitle>
            <CardDescription>Recent admin actions (append-only)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionLogs?.slice(0, 50).map(log => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.adminUsername}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[100px] truncate">
                        {log.campaignId?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {log.previousState && <Badge variant="outline" className="text-xs">{log.previousState}</Badge>}
                      </TableCell>
                      <TableCell>
                        {log.newState && <Badge variant="outline" className="text-xs">{log.newState}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {log.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!actionLogs || actionLogs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No admin actions logged yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {targetState === "FAILED" ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : (
                <ArrowRight className="w-5 h-5 text-chart-1" />
              )}
              Confirm State Transition
            </DialogTitle>
            <DialogDescription>
              You are about to transition this campaign from <strong>{selectedCampaign?.state}</strong> to <strong>{targetState}</strong>.
              {targetState === "FAILED" && " This will mark the campaign as failed."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Transition</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this state change (required for audit log)"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                data-testid="input-transition-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={targetState === "FAILED" ? "destructive" : "default"}
              onClick={handleTransition}
              disabled={!transitionReason.trim() || transitionMutation.isPending}
              data-testid="button-confirm-transition"
            >
              {transitionMutation.isPending ? "Processing..." : `Transition to ${targetState}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createCampaignDialogOpen} onOpenChange={setCreateCampaignDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-chart-1" />
              Create New Campaign
            </DialogTitle>
            <DialogDescription>
              Create a new campaign in AGGREGATION state. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Title *</Label>
              <Input
                id="campaign-title"
                placeholder="Enter campaign title"
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                data-testid="input-campaign-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-rules">Rules *</Label>
              <Textarea
                id="campaign-rules"
                placeholder="Enter the explicit rules participants must understand and agree to"
                value={newCampaignRules}
                onChange={(e) => setNewCampaignRules(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-campaign-rules"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-target">Target Amount *</Label>
                <Input
                  id="campaign-target"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10000"
                  value={newCampaignTargetAmount}
                  onChange={(e) => setNewCampaignTargetAmount(e.target.value)}
                  data-testid="input-campaign-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-unit-price">Unit Price *</Label>
                <Input
                  id="campaign-unit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="99.99"
                  value={newCampaignUnitPrice}
                  onChange={(e) => setNewCampaignUnitPrice(e.target.value)}
                  data-testid="input-campaign-unit-price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-deadline">Aggregation Deadline *</Label>
              <Input
                id="campaign-deadline"
                type="datetime-local"
                value={newCampaignDeadline}
                onChange={(e) => setNewCampaignDeadline(e.target.value)}
                data-testid="input-campaign-deadline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description (optional)</Label>
              <Textarea
                id="campaign-description"
                placeholder="Brief campaign description"
                value={newCampaignDescription}
                onChange={(e) => setNewCampaignDescription(e.target.value)}
                data-testid="input-campaign-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-image">Image URL (optional)</Label>
              <Input
                id="campaign-image"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newCampaignImageUrl}
                onChange={(e) => setNewCampaignImageUrl(e.target.value)}
                data-testid="input-campaign-image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateCampaignDialogOpen(false);
                resetCreateCampaignForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createCampaignMutation.mutate()}
              disabled={!isCreateFormValid() || createCampaignMutation.isPending}
              data-testid="button-submit-campaign"
            >
              {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
