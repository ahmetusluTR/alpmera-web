import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Upload, FileUp, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
  participantName: string;
  quantity: number;
  status: string;
  createdAt: string;
  deliveryId: string | null;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}

export default function FulfillmentConsolePage() {
  const [, params] = useRoute("/admin/campaigns/:id/fulfillment");
  const campaignId = params?.id;
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery<FulfillmentSummary>({
    queryKey: [`/api/admin/campaigns/${campaignId}/fulfillment`],
    enabled: !!campaignId,
  });

  const { data: commitments, isLoading: commitmentsLoading, refetch } = useQuery<CommitmentRoster[]>({
    queryKey: [`/api/admin/campaigns/${campaignId}/commitments`],
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
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/commitments`] });
      setImportDialogOpen(false);
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
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

  const isLoading = summaryLoading || commitmentsLoading;

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
          <Button onClick={() => setImportDialogOpen(true)} data-testid="button-import-delivery">
            <Upload className="w-4 h-4 mr-2" />
            Import Delivery Updates
          </Button>
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
                <CardTitle className="text-lg">Commitment Roster</CardTitle>
                <CardDescription>Participants and their delivery status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {commitments && commitments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Participant</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commitments.map((c) => (
                          <TableRow key={c.id} data-testid={`roster-row-${c.id}`}>
                            <TableCell className="font-mono text-xs">{c.referenceNumber}</TableCell>
                            <TableCell>{c.participantName}</TableCell>
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

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
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
