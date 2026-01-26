import { Link, useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";
import { format } from "date-fns";

type CreditEventType = "ISSUED" | "RESERVED" | "RELEASED" | "APPLIED" | "REVOKED" | "EXPIRED";

interface CreditLedgerEntry {
  id: string;
  participantId: string;
  participantEmail?: string;
  eventType: CreditEventType;
  amount: string;
  currency: string;
  campaignId: string | null;
  campaignName?: string;
  reason: string;
  createdAt: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: "ALL", label: "All event types" },
  { value: "ISSUED", label: "Issued" },
  { value: "RESERVED", label: "Reserved" },
  { value: "RELEASED", label: "Released" },
  { value: "APPLIED", label: "Applied" },
  { value: "REVOKED", label: "Revoked" },
  { value: "EXPIRED", label: "Expired" },
];

const EVENT_TYPE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ISSUED: { label: "Issued", variant: "default" },
  RESERVED: { label: "Reserved", variant: "secondary" },
  RELEASED: { label: "Released", variant: "outline" },
  APPLIED: { label: "Applied", variant: "secondary" },
  REVOKED: { label: "Revoked", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "outline" },
};

export default function CreditsPage() {
  const [, setLocation] = useLocation();
  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<CreditLedgerEntry>({
    endpoint: "/api/admin/credits",
    initialPageSize: 25,
    initialStatus: "ALL",
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
          <p className="text-muted-foreground mt-2">
            Append-only ledger of all Alpmera Credit events
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter credit ledger entries by participant, event type, or date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search by participant ID or email"
              statusValue={controls.status}
              onStatusChange={controls.setStatus}
              statusOptions={EVENT_TYPE_OPTIONS}
              createdFrom={controls.createdFrom}
              createdTo={controls.createdTo}
              onCreatedFromChange={controls.setCreatedFrom}
              onCreatedToChange={controls.setCreatedTo}
              pageSize={controls.pageSize}
              onPageSizeChange={(value) => controls.setPageSize(value)}
              onClearFilters={controls.resetFilters}
              extraFilters={
                <Input
                  placeholder="Participant ID"
                  value={controls.extraFilters.participantId || ""}
                  onChange={(e) =>
                    controls.setExtraFilters({ ...controls.extraFilters, participantId: e.target.value })
                  }
                />
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Ledger Entries</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${total} total entries`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <ListSkeleton rows={6} columns={7} />}

            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">Error loading entries</p>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load entries"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <>
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No credit ledger entries found" />
              </>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created At</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">
                          {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Link href={`/admin/participants/${entry.participantId}`}>
                            <a className="text-primary hover:underline">
                              {entry.participantEmail || entry.participantId.slice(0, 8)}
                            </a>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={entry.eventType} mapping={EVENT_TYPE_BADGES} />
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono">
                          <span className={parseFloat(entry.amount) >= 0 ? "text-green-600" : "text-red-600"}>
                            {parseFloat(entry.amount) >= 0 ? "+" : ""}
                            {parseFloat(entry.amount).toFixed(2)} {entry.currency}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.campaignId ? (
                            <Link href={`/admin/campaigns/${entry.campaignId}`}>
                              <a className="text-primary hover:underline">
                                {entry.campaignName || entry.campaignId.slice(0, 8)}
                              </a>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={entry.reason}>
                          {entry.reason}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/admin/credits/${entry.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="mt-4">
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
