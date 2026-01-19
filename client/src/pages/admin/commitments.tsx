import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CommitmentRow {
  id: string;
  referenceNumber: string;
  participantName: string;
  participantEmail: string;
  campaignId: string;
  campaignTitle: string | null;
  quantity: number;
  amount: string;
  status: string;
  createdAt: string;
}

interface CommitmentsResponse {
  rows: CommitmentRow[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "LOCKED", label: "Active" },
  { value: "RELEASED", label: "Released" },
  { value: "REFUNDED", label: "Refunded" },
];

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  LOCKED: { label: "Active", variant: "default" },
  RELEASED: { label: "Released", variant: "outline" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

const PAGE_SIZES = ["25", "50", "100"];

export default function AdminCommitmentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [campaignId, setCampaignId] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("25");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, campaignId, createdFrom, createdTo, pageSize]);

  const { data, isLoading, error } = useQuery<CommitmentsResponse>({
    queryKey: [
      "/api/admin/commitments",
      search,
      status,
      campaignId,
      createdFrom,
      createdTo,
      page,
      pageSize,
    ],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize,
      });
      if (search) params.append("search", search);
      if (status && status !== "ALL") params.append("status", status);
      if (campaignId) params.append("campaignId", campaignId);
      if (createdFrom) params.append("createdFrom", createdFrom);
      if (createdTo) params.append("createdTo", createdTo);

      const res = await fetch(`/api/admin/commitments?${params.toString()}`, {
        credentials: "include",
        signal,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const totalPages = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commitments</h1>
          <p className="text-muted-foreground mt-2">
            Track participant commitments across campaigns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Search and narrow results without loading large datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference, participant, or commitment ID"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  placeholder="Campaign ID"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {data ? `${data.total} total commitments` : "Loading total..."}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page size</span>
                <Select value={pageSize} onValueChange={setPageSize}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commitments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading commitments...
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">Error loading commitments</p>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load commitments"}
                </p>
              </div>
            )}

            {data && data.rows.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No commitments found
              </div>
            )}

            {data && data.rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference #</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-sm">{row.referenceNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">{row.participantName}</div>
                          <div className="text-xs text-muted-foreground">{row.participantEmail}</div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/campaigns/${row.campaignId}`}>
                            <a className="text-primary hover:underline">
                              {row.campaignTitle || row.campaignId}
                            </a>
                          </Link>
                          <div className="text-xs text-muted-foreground font-mono">
                            {row.campaignId}
                          </div>
                        </TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${parseFloat(row.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGES[row.status]?.variant || "outline"}>
                            {STATUS_BADGES[row.status]?.label || row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(row.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/commitments/${row.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {data && data.rows.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!canPrev}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={!canNext}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
