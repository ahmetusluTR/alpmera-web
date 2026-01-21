import { Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";

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

export default function AdminCommitmentsPage() {
  const {
    rows,
    total,
    page,
    pageSize,
    isLoading,
    error,
    controls,
  } = useAdminListEngine<CommitmentRow>({
    endpoint: "/api/admin/commitments",
    initialPageSize: 25,
    initialStatus: "ALL",
  });

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
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search by reference, participant, or commitment ID"
              statusValue={controls.status}
              onStatusChange={controls.setStatus}
              statusOptions={STATUS_OPTIONS}
              createdFrom={controls.createdFrom}
              createdTo={controls.createdTo}
              onCreatedFromChange={controls.setCreatedFrom}
              onCreatedToChange={controls.setCreatedTo}
              pageSize={controls.pageSize}
              onPageSizeChange={(value) => controls.setPageSize(value)}
              onClearFilters={controls.resetFilters}
              extraFilters={
                <Input
                  placeholder="Campaign ID"
                  value={controls.extraFilters.campaignId || ""}
                  onChange={(e) => controls.setExtraFilters({ ...controls.extraFilters, campaignId: e.target.value })}
                />
              }
            />
            <div className="text-sm text-muted-foreground mt-4">
              {isLoading ? "Loading total..." : `${total} total commitments`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commitments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <ListSkeleton rows={6} columns={8} />}

            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">Error loading commitments</p>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load commitments"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <>
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No commitments found" />
              </>
            )}

            {!isLoading && rows.length > 0 && (
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
                    {rows.map((row) => (
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
                          <StatusBadge status={row.status} mapping={STATUS_BADGES} />
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

            {!isLoading && rows.length > 0 && (
              <ListPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={controls.setPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
