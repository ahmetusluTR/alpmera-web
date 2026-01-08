import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TableRow 
} from "@/components/ui/table";
import { Search, RefreshCw, ArrowUp, ArrowDown, Download } from "lucide-react";
import { format } from "date-fns";

interface RefundEntry {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  campaignId: string;
  campaignName: string;
  commitmentCode: string;
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

function formatReason(reason: string): { label: string; code: string } {
  const label = REASON_LABELS[reason] || reason.replace(/_/g, " ");
  return { label, code: reason };
}

export default function RefundsPage() {
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: refunds, isLoading, error, refetch } = useQuery<RefundEntry[]>({
    queryKey: ["/api/admin/refunds"],
  });

  const handleDownloadReasonsRef = () => {
    window.open("/api/admin/refunds/reasons/export", "_blank");
  };

  const filteredRefunds = refunds
    ?.filter((r) => {
      if (reasonFilter !== "all" && r.reason !== reasonFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        if (!r.commitmentCode.toLowerCase().includes(searchLower) &&
            !r.campaignName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "amount") {
        cmp = parseFloat(a.amount) - parseFloat(b.amount);
      } else if (sortBy === "campaign") {
        cmp = a.campaignName.localeCompare(b.campaignName);
      } else if (sortBy === "reason") {
        cmp = a.reason.localeCompare(b.reason);
      }
      return sortDir === "desc" ? -cmp : cmp;
    }) || [];

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const uniqueReasons = Array.from(new Set(refunds?.map(r => r.reason) || []));

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

        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by commitment code or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-refunds"
            />
          </div>
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-reason-filter">
              <SelectValue placeholder="Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {uniqueReasons.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {REASON_LABELS[reason] || reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="reason">Reason</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortDir} data-testid="button-sort-dir">
            {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load refunds.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredRefunds.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No refunds found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commitment</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((refund) => {
                      const { label, code } = formatReason(refund.reason);
                      return (
                        <TableRow key={refund.id} data-testid={`refund-row-${refund.id}`}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(refund.createdAt), "yyyy-MM-dd HH:mm")}
                          </TableCell>
                          <TableCell className="font-mono">
                            ${parseFloat(refund.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{refund.commitmentCode}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {refund.campaignName}
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
