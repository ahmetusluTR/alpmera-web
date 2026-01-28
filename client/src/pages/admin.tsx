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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Plus,
  LogOut,
  Loader2,
  X
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

function clearAdminIdempotencyKey(action: "refund" | "release" | "transition", campaignId: string, targetState?: string): void {
  const storageKey = targetState 
    ? `admin-idem-${action}-${campaignId}-${targetState}`
    : `admin-idem-${action}-${campaignId}`;
  sessionStorage.removeItem(storageKey);
}

function getTransitionIdempotencyKey(campaignId: string, targetState: string): string {
  const storageKey = `admin-idem-transition-${campaignId}-${targetState}`;
  let existingKey = sessionStorage.getItem(storageKey);
  if (!existingKey) {
    existingKey = crypto.randomUUID();
    sessionStorage.setItem(storageKey, existingKey);
  }
  return existingKey;
}

// Fallback transitions in case server is unavailable
const FALLBACK_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  AGGREGATION: ["SUCCESS", "FAILED"],
  SUCCESS: ["PROCUREMENT", "FAILED"],
  PROCUREMENT: ["FULFILLMENT", "FAILED"],
  FULFILLMENT: ["COMPLETED", "FAILED"],
  FAILED: [],
  COMPLETED: [],
};

export default function AdminConsole() {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [mobileDetailSheetOpen, setMobileDetailSheetOpen] = useState(false);
  const [targetState, setTargetState] = useState<CampaignState | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminApiKey, setAdminApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState("");
  
  // Check session status on mount
  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ authenticated: boolean; username?: string }>({
    queryKey: ["/api/admin/session"],
    retry: false,
  });
  
  // Update auth state when session data loads
  if (sessionData && isAuthenticated === null) {
    setIsAuthenticated(sessionData.authenticated);
    if (sessionData.username) {
      setAdminUsername(sessionData.username);
    }
  }
  
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/login", {
        apiKey: adminApiKey,
        username: adminUsername,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      setAdminApiKey(""); // Clear from memory
      setLoginError("");
      toast({ title: "Logged In", description: `Welcome, ${data.username}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
    onError: (error: Error) => {
      setLoginError(error.message || "Invalid credentials");
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout", {});
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      toast({ title: "Logged Out", description: "You have been logged out." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
  });
  
  // Create campaign form state
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [newCampaignRules, setNewCampaignRules] = useState("");
  const [newCampaignImageUrl, setNewCampaignImageUrl] = useState("");
  const [newCampaignTargetAmount, setNewCampaignTargetAmount] = useState("");
  const [newCampaignUnitPrice, setNewCampaignUnitPrice] = useState("");
  const [newCampaignDeadline, setNewCampaignDeadline] = useState("");
  // New P0 fields
  const [newCampaignSku, setNewCampaignSku] = useState("");
  const [newCampaignProductName, setNewCampaignProductName] = useState("");
  const [newCampaignPrimaryImageUrl, setNewCampaignPrimaryImageUrl] = useState("");
  const [newCampaignDeliveryStrategy, setNewCampaignDeliveryStrategy] = useState<"SUPPLIER_DIRECT" | "CONSOLIDATION_POINT">("SUPPLIER_DIRECT");
  const [newCampaignReferencePriceAmount, setNewCampaignReferencePriceAmount] = useState("");
  const [newCampaignReferencePriceSource, setNewCampaignReferencePriceSource] = useState<"MSRP" | "RETAILER_LISTING" | "SUPPLIER_QUOTE" | "OTHER">("MSRP");
  const [newCampaignSupplierDirectConfirmed, setNewCampaignSupplierDirectConfirmed] = useState(false);
  // Consolidation fields
  const [newCampaignConsolidationCompany, setNewCampaignConsolidationCompany] = useState("");
  const [newCampaignConsolidationContactName, setNewCampaignConsolidationContactName] = useState("");
  const [newCampaignConsolidationContactEmail, setNewCampaignConsolidationContactEmail] = useState("");
  const [newCampaignConsolidationPhone, setNewCampaignConsolidationPhone] = useState("");
  const [newCampaignConsolidationAddressLine1, setNewCampaignConsolidationAddressLine1] = useState("");
  const [newCampaignConsolidationCity, setNewCampaignConsolidationCity] = useState("");
  const [newCampaignConsolidationState, setNewCampaignConsolidationState] = useState("");
  const [newCampaignConsolidationPostalCode, setNewCampaignConsolidationPostalCode] = useState("");
  const [newCampaignConsolidationCountry, setNewCampaignConsolidationCountry] = useState("USA");

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignWithStats[]>({
    queryKey: ["/api/admin/campaigns", "legacy"],
    queryFn: async () => {
      const res = await fetch("/api/admin/campaigns?mode=legacy", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
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
      const idempotencyKey = getTransitionIdempotencyKey(campaignId, newState);
      const response = await apiRequest("POST", `/api/admin/campaigns/${campaignId}/transition`, {
        newState,
        reason,
        adminUsername,
      }, {
        "x-idempotency-key": idempotencyKey,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const isIdempotent = data._idempotent === true;
      if (isIdempotent) {
        toast({ title: "Already Processed", description: "This transition was already processed. Showing current state." });
      } else {
        toast({ title: "State Transition Complete", description: "The campaign state has been updated." });
      }
      clearAdminIdempotencyKey("transition", variables.campaignId, variables.newState);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaignId, "commitments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Release Failed", description: error.message, variant: "destructive" });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // Build reference prices array
      const referencePrices = newCampaignReferencePriceAmount 
        ? [{ amount: parseFloat(newCampaignReferencePriceAmount), source: newCampaignReferencePriceSource }]
        : [];
      
      const payload: Record<string, unknown> = {
        adminUsername,
        title: newCampaignTitle,
        description: newCampaignDescription,
        rules: newCampaignRules,
        imageUrl: newCampaignImageUrl || null,
        targetAmount: newCampaignTargetAmount,
        unitPrice: newCampaignUnitPrice,
        minCommitment: newCampaignUnitPrice,
        aggregationDeadline: newCampaignDeadline,
        // New P0 fields
        sku: newCampaignSku || null,
        productName: newCampaignProductName || null,
        primaryImageUrl: newCampaignPrimaryImageUrl || null,
        deliveryStrategy: newCampaignDeliveryStrategy,
        referencePrices: referencePrices.length > 0 ? referencePrices : null,
        supplierDirectConfirmed: newCampaignSupplierDirectConfirmed,
      };

      // Add consolidation fields if using consolidation point
      if (newCampaignDeliveryStrategy === "CONSOLIDATION_POINT") {
        payload.consolidationCompany = newCampaignConsolidationCompany || null;
        payload.consolidationContactName = newCampaignConsolidationContactName || null;
        payload.consolidationContactEmail = newCampaignConsolidationContactEmail || null;
        payload.consolidationPhone = newCampaignConsolidationPhone || null;
        payload.consolidationAddressLine1 = newCampaignConsolidationAddressLine1 || null;
        payload.consolidationCity = newCampaignConsolidationCity || null;
        payload.consolidationState = newCampaignConsolidationState || null;
        payload.consolidationPostalCode = newCampaignConsolidationPostalCode || null;
        payload.consolidationCountry = newCampaignConsolidationCountry || null;
      }

      const response = await apiRequest("POST", `/api/admin/campaigns`, payload);
      return response.json();
    },
    onSuccess: (campaign) => {
      toast({ title: "Campaign Created", description: `Campaign "${campaign.title}" has been created in AGGREGATION state.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
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
    // Reset new P0 fields
    setNewCampaignSku("");
    setNewCampaignProductName("");
    setNewCampaignPrimaryImageUrl("");
    setNewCampaignDeliveryStrategy("SUPPLIER_DIRECT");
    setNewCampaignReferencePriceAmount("");
    setNewCampaignReferencePriceSource("MSRP");
    setNewCampaignSupplierDirectConfirmed(false);
    // Reset consolidation fields
    setNewCampaignConsolidationCompany("");
    setNewCampaignConsolidationContactName("");
    setNewCampaignConsolidationContactEmail("");
    setNewCampaignConsolidationPhone("");
    setNewCampaignConsolidationAddressLine1("");
    setNewCampaignConsolidationCity("");
    setNewCampaignConsolidationState("");
    setNewCampaignConsolidationPostalCode("");
    setNewCampaignConsolidationCountry("USA");
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

  // Show loading while checking session
  if (sessionLoading || isAuthenticated === null) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-20">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Checking authentication...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Login
              </CardTitle>
              <CardDescription>Enter your credentials to access the admin console</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  data-testid="input-login-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-api-key">Admin API Key</Label>
                <Input
                  id="login-api-key"
                  type="password"
                  value={adminApiKey}
                  onChange={(e) => setAdminApiKey(e.target.value)}
                  placeholder="Enter admin API key"
                  data-testid="input-login-api-key"
                />
              </div>
              {loginError && (
                <div className="text-sm text-destructive" data-testid="text-login-error">
                  {loginError}
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => loginMutation.mutate()}
                disabled={loginMutation.isPending || !adminApiKey}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Campaign detail content - reused in desktop pane and mobile sheet
  const CampaignDetailContent = () => {
    if (!selectedCampaign) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a campaign to view details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle data-testid="selected-campaign-title" className="truncate">{selectedCampaign.title}</CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  ID: {selectedCampaign.id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={`text-sm ${STATE_COLORS[selectedCampaign.state]}`} data-testid="selected-campaign-state">
                  {selectedCampaign.state}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCampaignId(null)}
                  title="Clear selection"
                  data-testid="button-clear-selection"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
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
                {selectedCampaign.state === "COMPLETED" && (
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
            <ScrollArea className="h-[200px]">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Audit Log
            </CardTitle>
            <CardDescription>Recent admin actions (append-only)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[180px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionLogs?.filter(l => l.campaignId === selectedCampaign.id).slice(0, 20).map(log => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.adminUsername}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        {log.previousState && <Badge variant="outline" className="text-xs">{log.previousState}</Badge>}
                      </TableCell>
                      <TableCell>
                        {log.newState && <Badge variant="outline" className="text-xs">{log.newState}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {log.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!actionLogs || actionLogs.filter(l => l.campaignId === selectedCampaign.id).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No actions logged for this campaign
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const handleCampaignSelect = (campaignId: string) => {
    // Toggle selection: clicking the same campaign again clears selection
    if (selectedCampaignId === campaignId) {
      setSelectedCampaignId(null);
      setMobileDetailSheetOpen(false);
    } else {
      setSelectedCampaignId(campaignId);
      setMobileDetailSheetOpen(true);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b shrink-0">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="admin-title">
              <Shield className="w-6 h-6" />
              Admin Console
            </h1>
            <p className="text-muted-foreground text-sm">Manage campaigns, state transitions, and audit logs</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">Logged in as: <strong>{adminUsername}</strong></span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Two-pane master/detail layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left pane - Campaign list */}
          <div className="w-full lg:w-[35%] lg:min-w-[320px] lg:max-w-[400px] border-r flex flex-col">
            <div className="p-4 border-b shrink-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="font-semibold">Campaigns</h2>
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
                  <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                  <SelectItem value="FULFILLMENT">Fulfillment</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="flex-1">
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
                      onClick={() => handleCampaignSelect(campaign.id)}
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
          </div>

          {/* Right pane - Campaign details (desktop only) */}
          <div className="hidden lg:block flex-1 overflow-y-auto p-6">
            <CampaignDetailContent />
          </div>
        </div>

        {/* Mobile sheet for campaign details */}
        <Sheet open={mobileDetailSheetOpen} onOpenChange={setMobileDetailSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Campaign Details</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <CampaignDetailContent />
            </div>
          </SheetContent>
        </Sheet>
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

            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">Product Details (required for publishing)</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-sku">SKU</Label>
                <Input
                  id="campaign-sku"
                  placeholder="PROD-001"
                  value={newCampaignSku}
                  onChange={(e) => setNewCampaignSku(e.target.value)}
                  data-testid="input-campaign-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-product-name">Product Name</Label>
                <Input
                  id="campaign-product-name"
                  placeholder="Product display name"
                  value={newCampaignProductName}
                  onChange={(e) => setNewCampaignProductName(e.target.value)}
                  data-testid="input-campaign-product-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-primary-image">Primary Image URL</Label>
              <Input
                id="campaign-primary-image"
                type="url"
                placeholder="https://example.com/product-image.jpg"
                value={newCampaignPrimaryImageUrl}
                onChange={(e) => setNewCampaignPrimaryImageUrl(e.target.value)}
                data-testid="input-campaign-primary-image"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-ref-price">Reference Price</Label>
                <Input
                  id="campaign-ref-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="129.99"
                  value={newCampaignReferencePriceAmount}
                  onChange={(e) => setNewCampaignReferencePriceAmount(e.target.value)}
                  data-testid="input-campaign-ref-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-ref-source">Price Source</Label>
                <Select 
                  value={newCampaignReferencePriceSource} 
                  onValueChange={(v: "MSRP" | "RETAILER_LISTING" | "SUPPLIER_QUOTE" | "OTHER") => setNewCampaignReferencePriceSource(v)}
                >
                  <SelectTrigger data-testid="select-campaign-ref-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MSRP">MSRP</SelectItem>
                    <SelectItem value="RETAILER_LISTING">Retailer Listing</SelectItem>
                    <SelectItem value="SUPPLIER_QUOTE">Supplier Quote</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">Delivery Configuration</p>

            <div className="space-y-2">
              <Label htmlFor="campaign-delivery-strategy">Delivery Strategy</Label>
              <Select 
                value={newCampaignDeliveryStrategy} 
                onValueChange={(v: "SUPPLIER_DIRECT" | "CONSOLIDATION_POINT") => setNewCampaignDeliveryStrategy(v)}
              >
                <SelectTrigger data-testid="select-campaign-delivery-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER_DIRECT">Direct from Supplier</SelectItem>
                  <SelectItem value="CONSOLIDATION_POINT">Consolidation Point</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCampaignDeliveryStrategy === "SUPPLIER_DIRECT" && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="campaign-supplier-confirmed"
                  checked={newCampaignSupplierDirectConfirmed}
                  onChange={(e) => setNewCampaignSupplierDirectConfirmed(e.target.checked)}
                  className="rounded border-border"
                  data-testid="checkbox-supplier-confirmed"
                />
                <Label htmlFor="campaign-supplier-confirmed" className="text-sm">
                  Supplier confirmed direct delivery capability
                </Label>
              </div>
            )}

            {newCampaignDeliveryStrategy === "CONSOLIDATION_POINT" && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                <p className="text-sm font-medium">Consolidation Point Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-company">Company Name</Label>
                    <Input
                      id="consolidation-company"
                      placeholder="Company name"
                      value={newCampaignConsolidationCompany}
                      onChange={(e) => setNewCampaignConsolidationCompany(e.target.value)}
                      data-testid="input-consolidation-company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-contact">Contact Name</Label>
                    <Input
                      id="consolidation-contact"
                      placeholder="Contact person"
                      value={newCampaignConsolidationContactName}
                      onChange={(e) => setNewCampaignConsolidationContactName(e.target.value)}
                      data-testid="input-consolidation-contact"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-email">Contact Email</Label>
                    <Input
                      id="consolidation-email"
                      type="email"
                      placeholder="contact@company.com"
                      value={newCampaignConsolidationContactEmail}
                      onChange={(e) => setNewCampaignConsolidationContactEmail(e.target.value)}
                      data-testid="input-consolidation-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-phone">Phone</Label>
                    <Input
                      id="consolidation-phone"
                      placeholder="555-123-4567"
                      value={newCampaignConsolidationPhone}
                      onChange={(e) => setNewCampaignConsolidationPhone(e.target.value)}
                      data-testid="input-consolidation-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consolidation-address">Address</Label>
                  <Input
                    id="consolidation-address"
                    placeholder="Street address"
                    value={newCampaignConsolidationAddressLine1}
                    onChange={(e) => setNewCampaignConsolidationAddressLine1(e.target.value)}
                    data-testid="input-consolidation-address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-city">City</Label>
                    <Input
                      id="consolidation-city"
                      placeholder="City"
                      value={newCampaignConsolidationCity}
                      onChange={(e) => setNewCampaignConsolidationCity(e.target.value)}
                      data-testid="input-consolidation-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-state">State</Label>
                    <Input
                      id="consolidation-state"
                      placeholder="CA"
                      value={newCampaignConsolidationState}
                      onChange={(e) => setNewCampaignConsolidationState(e.target.value)}
                      data-testid="input-consolidation-state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consolidation-postal">Postal Code</Label>
                    <Input
                      id="consolidation-postal"
                      placeholder="90210"
                      value={newCampaignConsolidationPostalCode}
                      onChange={(e) => setNewCampaignConsolidationPostalCode(e.target.value)}
                      data-testid="input-consolidation-postal"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="campaign-image">Legacy Image URL (optional)</Label>
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
