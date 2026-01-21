import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useAdminListEngine, type ListResponse } from "@/lib/admin-list-engine";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListEmptyState, ListMismatchBanner } from "@/components/admin/list-state";
import { 
  Search, 
  RefreshCw, 
  Download, 
  FileUp, 
  ArrowUp, 
  ArrowDown, 
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  title: string;
  state: string;
  targetAmount: string;
  totalCommitted: number;
  participantCount: number;
}

interface RefundPlan {
  id: string;
  status: string;
  rowCount: number;
  totalAmount: number;
  campaignId: string | null;
  campaignName: string | null;
  createdAt: string;
}

const STATE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  AGGREGATION: { label: "Aggregation", variant: "secondary" },
  SUCCESS: { label: "Success", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  FULFILLMENT: { label: "Fulfillment", variant: "outline" },
  RELEASED: { label: "Released", variant: "outline" },
};

export default function RefundPlansPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const { rows: campaigns, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<Campaign>({
    endpoint: "/api/admin/campaigns",
    initialPageSize: 25,
    initialStatus: "all",
    initialSort: "name_asc",
  });

  const { data: plans } = useQuery<ListResponse<RefundPlan>>({
    queryKey: ["/api/admin/refund-plans"],
  });

  const { sortKey, sortDir } = useMemo(() => {
    const [key, dir] = (controls.sort || "name_asc").split("_");
    const normalizedKey = key || "name";
    const normalizedDir = dir === "desc" ? "desc" : "asc";
    return { sortKey: normalizedKey, sortDir: normalizedDir as "asc" | "desc" };
  }, [controls.sort]);

  const sortByValue = sortKey === "name" ? "title" : sortKey === "state" ? "state" : "commitments";

  const handleSortByChange = (value: string) => {
    const nextKey = value === "title" ? "name" : value === "state" ? "state" : "commitments";
    controls.setSort(`${nextKey}_${sortDir}`);
  };

  const toggleSortDir = () => {
    const nextDir = sortDir === "asc" ? "desc" : "asc";
    controls.setSort(`${sortKey}_${nextDir}`);
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleExportEligible = () => {
    if (!selectedCampaign) return;
    window.open(`/api/admin/campaigns/${selectedCampaign.id}/refunds/eligible/export`, "_blank");
  };

  const handleDownloadTemplate = () => {
    if (!selectedCampaign) return;
    window.open(`/api/admin/campaigns/${selectedCampaign.id}/refunds/template`, "_blank");
  };

  const handleDownloadReasonsRef = () => {
    window.open("/api/admin/refunds/reasons/export", "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = () => {
    // Import logic placeholder - endpoint returns 501
    setImportDialogOpen(false);
  };

  const campaignHasPlans = (campaignId: string) => {
    return plans?.rows?.some(p => p.campaignId === campaignId) || false;
  };

  if (selectedCampaign) {
    const stateBadge = STATE_BADGES[selectedCampaign.state] || { label: selectedCampaign.state, variant: "outline" as const };
    const existingPlans = plans?.rows?.filter(p => p.campaignId === selectedCampaign.id) || [];
    
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedCampaign(null)}
                className="mb-2"
                data-testid="button-back-to-campaigns"
              >
                Back to Campaigns
              </Button>
              <h1 className="text-2xl font-semibold" data-testid="text-refund-planning-heading">
                Refund Planning
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm">{selectedCampaign.title}</span>
                <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Commitments</CardTitle>
              </CardHeader>
            <CardContent>
                <p className="text-2xl font-mono" data-testid="text-commitment-count">
                  {selectedCampaign.participantCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-mono" data-testid="text-current-amount">
                  ${Number(selectedCampaign.totalCommitted || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-mono" data-testid="text-target-amount">
                  ${parseFloat(selectedCampaign.targetAmount || "0").toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Export Eligible Commitments
              </CardTitle>
              <CardDescription>
                Download a list of commitments that are eligible for refund (LOCKED status with refundable balance).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportEligible} data-testid="button-export-eligible">
                <Download className="w-4 h-4 mr-2" />
                Export Eligible Commitments (CSV)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="w-5 h-5" />
                Import Refund Plan
              </CardTitle>
              <CardDescription>
                Upload a CSV to create a DRAFT refund plan. Amounts are validated against the escrow ledger.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleDownloadTemplate} data-testid="button-download-template">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
                <Button variant="outline" onClick={handleDownloadReasonsRef} data-testid="button-download-reasons">
                  <Download className="w-4 h-4 mr-2" />
                  Reason Codes Reference
                </Button>
                <Button variant="ghost" onClick={() => setHelpDialogOpen(true)} data-testid="button-schema-help">
                  Schema Help
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-md p-4 text-sm space-y-2">
                <p className="font-medium">CSV Format:</p>
                <div className="font-mono text-xs space-y-1">
                  <p><span className="text-green-600 dark:text-green-400">Required:</span> commitment_code, reason_code</p>
                  <p><span className="text-muted-foreground">Optional:</span> note</p>
                </div>
                <div className="flex items-start gap-2 mt-3 text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">
                    Amounts are <strong>not</strong> specified in the import. They are derived from the escrow ledger to prevent manipulation.
                  </p>
                </div>
              </div>

              <Button onClick={() => setImportDialogOpen(true)} data-testid="button-open-import">
                <FileUp className="w-4 h-4 mr-2" />
                Upload Refund Plan CSV
              </Button>
            </CardContent>
          </Card>

          {existingPlans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Plans for this Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingPlans.map((plan) => (
                        <TableRow 
                          key={plan.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setLocation(`/admin/refund-plans/${plan.id}`)}
                          data-testid={`plan-row-${plan.id}`}
                        >
                          <TableCell className="font-mono text-xs">{plan.id.slice(0, 8)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{plan.status}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{plan.rowCount}</TableCell>
                          <TableCell className="font-mono">${plan.totalAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(plan.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Refund Plan</DialogTitle>
              <DialogDescription>
                Upload a CSV file to create a DRAFT refund plan for {selectedCampaign.title}.
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
                disabled={!selectedFile}
                data-testid="button-confirm-import"
              >
                Create Draft Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Refund Plan CSV Schema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div>
                <p className="font-medium mb-2">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">commitment_code</code> - The reference number of the commitment</li>
                  <li><code className="bg-muted px-1 rounded">reason_code</code> - Use codes from the Reason Reference export</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Optional Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">note</code> - Additional context for the refund</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Common Reason Codes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">campaign_failed_refund</code> - Campaign failed to reach target</li>
                  <li><code className="bg-muted px-1 rounded">admin_manual_refund</code> - Manual admin refund</li>
                  <li><code className="bg-muted px-1 rounded">participant_request</code> - Participant requested</li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  Download the full Reason Codes Reference CSV for all available codes and their descriptions.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHelpDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-refund-plans-heading">Refund Planning</h1>
            <p className="text-muted-foreground text-sm">Select a campaign to manage refund plans</p>
          </div>
          <Button variant="outline" onClick={handleDownloadReasonsRef} data-testid="button-export-reasons-global">
            <Download className="w-4 h-4 mr-2" />
            Reason Codes Reference
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={controls.searchInput}
              onChange={(e) => controls.setSearchInput(e.target.value)}
              className="pl-9"
              data-testid="input-search-campaigns"
            />
          </div>
          <Select value={controls.status} onValueChange={controls.setStatus}>
            <SelectTrigger className="w-[150px]" data-testid="select-state-filter">
              <SelectValue placeholder="State" />
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
          <Select value={sortByValue} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-[130px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="state">State</SelectItem>
              <SelectItem value="commitments">Commitments</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortDir} data-testid="button-sort-dir">
            {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
          <Select value={String(controls.pageSize)} onValueChange={(value) => controls.setPageSize(Number(value))}>
            <SelectTrigger className="w-[130px]" data-testid="select-page-size">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={controls.resetFilters} data-testid="button-clear-filters">
            Clear filters
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load campaigns.</p>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] })}
                  data-testid="button-retry"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-4">
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No campaigns found" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Commitments</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Plans</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const stateBadge = STATE_BADGES[campaign.state] || { label: campaign.state, variant: "outline" as const };
                      const hasPlans = campaignHasPlans(campaign.id);
                      return (
                        <TableRow
                          key={campaign.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleCampaignSelect(campaign)}
                          data-testid={`campaign-row-${campaign.id}`}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {campaign.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{campaign.participantCount}</TableCell>
                          <TableCell className="font-mono">
                            ${Number(campaign.totalCommitted || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {hasPlans ? (
                              <Badge variant="outline" className="text-xs">Has Plans</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {!isLoading && !error && campaigns.length > 0 && (
          <div className="mt-4">
            <ListPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={controls.setPage}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
