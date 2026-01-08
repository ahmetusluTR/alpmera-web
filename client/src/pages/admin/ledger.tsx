import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface LedgerEntry {
  id: string;
  entryType: "LOCK" | "REFUND" | "RELEASE";
  amount: string;
  createdAt: string;
  actor: string;
  reason: string;
  campaignId: string;
  commitmentId: string;
}

const TYPE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  LOCK: { label: "Lock", variant: "secondary" },
  REFUND: { label: "Refund", variant: "outline" },
  RELEASE: { label: "Release", variant: "default" },
};

export default function LedgerExplorerPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: entries, isLoading, error, refetch } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/admin/clearing/ledger"],
  });

  const filteredEntries = entries
    ?.filter((e) => {
      if (typeFilter !== "all" && e.entryType !== typeFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        if (!e.reason.toLowerCase().includes(searchLower) &&
            !e.actor.toLowerCase().includes(searchLower) &&
            !e.campaignId.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/clearing">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-ledger-heading">Ledger Explorer</h1>
            <p className="text-muted-foreground text-sm">Append-only escrow movement records</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reason, actor, campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-ledger"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LOCK">Lock</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="RELEASE">Release</SelectItem>
            </SelectContent>
          </Select>
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
                <p className="text-muted-foreground mb-4">Unable to load ledger.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No entries found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => {
                      const typeBadge = TYPE_BADGES[entry.entryType] || { label: entry.entryType, variant: "outline" as const };
                      return (
                        <TableRow key={entry.id} data-testid={`ledger-row-${entry.id}`}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${parseFloat(entry.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">{entry.actor}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {entry.reason}
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
