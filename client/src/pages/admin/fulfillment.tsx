import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Upload, FileUp, Loader2, MoreHorizontal, Plus, Clock, Download, FileDown, Info } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FulfillmentSummary {
  campaignId: string;
  campaignTitle: string;
  deliveryStrategy: string;
  currentMilestone: string;
  lastUpdateAt: string | null;
  nextUpdateDueAt: string | null;
  totalCommitments: number;
  deliveredCount: number;
}

interface CommitmentRoster {
  id: string;
  referenceNumber: string;
  quantity: number;
  status: string;
  createdAt: string;
  deliveryId: string | null;
}

interface MilestoneEvent {
  id: string;
  milestone: string;
  note: string;
  createdAt: string;
  actor: string;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}

const MILESTONES = [
  { value: "SCHEDULED", label: "Fulfillment scheduled" },
  { value: "IN_PROGRESS", label: "Fulfillment in progress" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "EXCEPTION", label: "Exception raised" },
];

export default function FulfillmentConsolePage() {
  const [, params] = useRoute("/admin/campaigns/:id/fulfillment");
  const campaignId = params?.id;
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [milestoneNote, setMilestoneNote] = useState("");

  const { data: summary, isLoading: summaryLoading } = useQuery<FulfillmentSummary>({
    queryKey: [`/api/admin/campaigns/${campaignId}/fulfillment`],
    enabled: !!campaignId,
  });

  const { data: commitments, isLoading: commitmentsLoading } = useQuery<CommitmentRoster[]>({
    queryKey: ["/api/admin/campaigns", campaignId, "commitments"],
    enabled: !!campaignId,
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<MilestoneEvent[]>({
    queryKey: [`/api/admin/campaigns/${campaignId}/fulfillment/milestones`],
    enabled: !!campaignId,
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/admin/campaigns/${campaignId}/fulfillment/import`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Import failed");
      }
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      if (result.successCount > 0) {
        toast({
          title: "Import Complete",
          description: `${result.successCount} delivery events imported successfully.`,
        });
      }
      if (result.errorCount > 0) {
        toast({
          title: "Some Rows Failed",
          description: `${result.errorCount} rows failed validation.`,
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/fulfillment`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns", campaignId, "commitments"] });
      setImportDialogOpen(false);
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    },
  });

  const milestoneMutation = useMutation({
    mutationFn: async ({ milestone, note }: { milestone: string; note: string }) => {
      const response = await apiRequest("POST", `/api/admin/campaigns/${campaignId}/fulfillment/milestone`, {
        milestone,
        note,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Milestone Updated", description: "Delivery milestone has been recorded." });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/fulfillment`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/fulfillment/milestones`] });
      setMilestoneDialogOpen(false);
      setSelectedMilestone("");
      setMilestoneNote("");
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleMilestoneSubmit = () => {
    if (selectedMilestone && milestoneNote.trim()) {
      milestoneMutation.mutate({ milestone: selectedMilestone, note: milestoneNote.trim() });
    }
  };

  const isLoading = summaryLoading || commitmentsLoading;
  const hasCommitments = (commitments?.length ?? 0) > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/admin/campaigns/${campaignId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold" data-testid="text-fulfillment-heading">
              Fulfillment Console
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {summary?.campaignTitle || "Loading..."}
            </p>
          </div>
          <Button onClick={() => setMilestoneDialogOpen(true)} data-testid="button-update-milestone">
            <Plus className="w-4 h-4 mr-2" />
            Update Milestone
          </Button>
          {hasCommitments ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-more-actions">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Delivery Updates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fulfillment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Delivery Strategy</p>
                    <Badge variant="outline">{summary?.deliveryStrategy || "Standard"}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Current Milestone</p>
                    <Badge variant="secondary">{summary?.currentMilestone || "Pending"}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Last Update</p>
                    <p className="text-sm">
                      {summary?.lastUpdateAt 
                        ? format(new Date(summary.lastUpdateAt), "MMM d, yyyy HH:mm")
                        : "No updates yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Delivered</p>
                    <p className="text-xl font-mono font-semibold">
                      {summary?.deliveredCount ?? 0} / {summary?.totalCommitments ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Timeline</CardTitle>
                <CardDescription>Append-only milestone events</CardDescription>
              </CardHeader>
              <CardContent>
                {milestonesLoading ? (
                  <Skeleton className="h-20" />
                ) : milestones && milestones.length > 0 ? (
                  <div className="space-y-3">
                    {milestones.map((event) => (
                      <div key={event.id} className="flex gap-3 items-start border-l-2 border-muted pl-4 py-2">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{event.milestone}</Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {format(new Date(event.createdAt), "yyyy-MM-dd HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">by {event.actor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No delivery events yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supplier Export</CardTitle>
                <CardDescription>Download eligible commitment manifest for fulfillment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  {summary?.deliveryStrategy === "BULK_TO_CONSOLIDATION" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.location.href = `/api/admin/campaigns/${campaignId}/fulfillment/export/bulk`;
                      }}
                      data-testid="button-export-bulk"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export supplier manifest (bulk)
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.location.href = `/api/admin/campaigns/${campaignId}/fulfillment/export/direct`;
                      }}
                      data-testid="button-export-direct"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export supplier manifest (direct)
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Only eligible commitments (LOCKED status) are included. Export is logged for audit.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commitment Roster</CardTitle>
                <CardDescription>Commitments and their delivery status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {commitments && commitments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commitments.map((c) => (
                          <TableRow key={c.id} data-testid={`roster-row-${c.id}`}>
                            <TableCell className="font-mono text-xs">{c.referenceNumber}</TableCell>
                            <TableCell className="font-mono">{c.quantity}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{c.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(c.createdAt), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No commitments found.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Milestone</DialogTitle>
            <DialogDescription>
              Record a delivery milestone event. This is append-only and cannot be edited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
                <SelectTrigger data-testid="select-milestone">
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (required)</Label>
              <Textarea
                id="note"
                placeholder="Brief reason or description..."
                value={milestoneNote}
                onChange={(e) => setMilestoneNote(e.target.value)}
                className="resize-none"
                data-testid="input-milestone-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMilestoneSubmit}
              disabled={!selectedMilestone || !milestoneNote.trim() || milestoneMutation.isPending}
              data-testid="button-confirm-milestone"
            >
              {milestoneMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Record Milestone"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Delivery Updates</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import append-only delivery events. Each row is processed idempotently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                data-testid="input-csv-file"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileUp className="w-4 h-4" />
                <span>{selectedFile.name}</span>
              </div>
            )}
            <div className="border rounded-md p-3 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="w-4 h-4" />
                CSV Schema
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Required:</strong> commitment_code, milestone_code</p>
                <p><strong>Optional:</strong> carrier, tracking_url, note</p>
                <p className="pt-1"><strong>Allowed milestone_code values:</strong></p>
                <p className="font-mono text-xs">FULFILLMENT_SCHEDULED, IN_PROGRESS, SHIPPED, DELIVERED, EXCEPTION</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.location.href = "/api/admin/fulfillment/import-template";
              }}
              data-testid="button-download-template"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Download CSV template
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              data-testid="button-confirm-import"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
