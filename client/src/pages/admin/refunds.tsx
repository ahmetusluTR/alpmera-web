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
import { Search, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
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
  campaign_failed_refund: "Campaign failed (bulk refund)",
  admin_manual_refund: "Manual refund by admin",
  commitment_cancelled: "Commitment cancelled",
  duplicate_commitment: "Duplicate commitment",
  participant_request: "Participant request",
};

function formatReason(reason: string): string {
  return REASON_LABELS[reason] || reason.replace(/_/g, " ");
}

export default function RefundsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: refunds, isLoading, error, refetch } = useQuery<RefundEntry[]>({
    queryKey: ["/api/admin/refunds"],
  });

  const filteredRefunds = refunds
    ?.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
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
      }
      return sortDir === "desc" ? -cmp : cmp;
    }) || [];

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-refunds-heading">Refunds</h1>
          <p className="text-muted-foreground text-sm">All refund entries from the escrow ledger</p>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commitment</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((refund) => (
                      <TableRow key={refund.id} data-testid={`refund-row-${refund.id}`}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(refund.createdAt), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{refund.status}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          ${parseFloat(refund.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{refund.commitmentCode}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {refund.campaignName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block cursor-help">
                                {formatReason(refund.reason)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{refund.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
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
