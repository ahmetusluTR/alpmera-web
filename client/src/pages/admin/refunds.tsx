import { useMemo } from "react";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";
import { Download } from "lucide-react";
import { format } from "date-fns";

interface RefundEntry {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  campaignId: string;
  campaignName: string | null;
  commitmentCode: string | null;
  reason: string;
}

const REASON_LABELS: Record<string, string> = {
  campaign_failed_refund: "Campaign Failed",
  admin_manual_refund: "Manual Refund",
  commitment_cancelled: "Commitment Cancelled",
  duplicate_commitment: "Duplicate Commitment",
  participant_request: "Participant Request",
  supplier_unable_to_fulfill: "Supplier Unable to Fulfill",
  quality_issue: "Quality Issue",
  delivery_failure: "Delivery Failure",
};

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  COMPLETED: { label: "Completed", variant: "outline" },
};

function formatReason(reason: string): { label: string; code: string } {
  const label = REASON_LABELS[reason] || reason.replace(/_/g, " ");
  return { label, code: reason };
}

export default function RefundsPage() {
  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<RefundEntry>({
    endpoint: "/api/admin/refunds",
    initialPageSize: 25,
    initialStatus: "ALL",
  });

  const reasonOptions = useMemo(() => {
    const reasons = Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label }));
    return [{ value: "ALL", label: "All Reasons" }, ...reasons];
  }, []);

  const handleDownloadReasonsRef = () => {
    window.open("/api/admin/refunds/reasons/export", "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-refunds-heading">Refunds</h1>
            <p className="text-muted-foreground text-sm">All refund entries from the escrow ledger</p>
          </div>
          <Button variant="outline" onClick={handleDownloadReasonsRef} data-testid="button-export-reasons">
            <Download className="w-4 h-4 mr-2" />
            Reason Codes Reference
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search by commitment code or campaign"
              statusValue={controls.extraFilters.reason || "ALL"}
              onStatusChange={(value) => controls.setExtraFilters({ ...controls.extraFilters, reason: value })}
              statusOptions={reasonOptions}
              createdFrom={controls.createdFrom}
              createdTo={controls.createdTo}
              onCreatedFromChange={controls.setCreatedFrom}
              onCreatedToChange={controls.setCreatedTo}
              pageSize={controls.pageSize}
              onPageSizeChange={(value) => controls.setPageSize(value)}
              onClearFilters={controls.resetFilters}
              extraFilters={
                <>
                  <Input
                    placeholder="Campaign ID"
                    value={controls.extraFilters.campaignId || ""}
                    onChange={(e) =>
                      controls.setExtraFilters({ ...controls.extraFilters, campaignId: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Commitment code"
                    value={controls.extraFilters.commitmentCode || ""}
                    onChange={(e) =>
                      controls.setExtraFilters({ ...controls.extraFilters, commitmentCode: e.target.value })
                    }
                  />
                </>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4">
                <ListSkeleton rows={6} columns={6} />
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">Unable to load refunds.</p>
                <p className="text-muted-foreground text-sm">
                  {error instanceof Error ? error.message : "Failed to load refunds"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <div className="p-4">
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No refunds found" />
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commitment</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((refund) => {
                      const { label, code } = formatReason(refund.reason);
                      return (
                        <TableRow key={refund.id} data-testid={`refund-row-${refund.id}`}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(refund.createdAt), "yyyy-MM-dd HH:mm")}
                          </TableCell>
                          <TableCell className="font-mono">
                            ${parseFloat(refund.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {refund.commitmentCode || "Unknown"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {refund.campaignName || refund.campaignId}
                          </TableCell>
                          <TableCell className="text-sm max-w-[180px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <span className="block truncate">{label}</span>
                                  <span className="font-mono text-xs text-muted-foreground">{code}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{code}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={refund.status} mapping={STATUS_BADGES} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="p-4">
                <ListPagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={controls.setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
