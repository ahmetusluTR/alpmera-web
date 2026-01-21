import { useMemo } from "react";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { format } from "date-fns";
import { Link } from "wouter";

interface AuditLogEntry {
  id: string;
  adminUsername: string;
  action: string;
  previousState: string | null;
  newState: string | null;
  reason: string | null;
  campaignId: string | null;
  commitmentId: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<AuditLogEntry>({
    endpoint: "/api/admin/logs",
    initialPageSize: 25,
  });

  const actionLabel = useMemo(() => {
    return (entry: AuditLogEntry) => {
      if (entry.previousState && entry.newState) {
        return `${entry.action}: ${entry.previousState} -> ${entry.newState}`;
      }
      return entry.action;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Audit Log</h1>
            <p className="text-muted-foreground text-sm">
              Append-only record of admin actions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search by admin, action, reason, or ID"
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
                    placeholder="Commitment ID"
                    value={controls.extraFilters.commitmentId || ""}
                    onChange={(e) =>
                      controls.setExtraFilters({ ...controls.extraFilters, commitmentId: e.target.value })
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
                <p className="text-muted-foreground mb-2">Unable to load audit log.</p>
                <p className="text-muted-foreground text-sm">
                  {error instanceof Error ? error.message : "Failed to load audit log"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <div className="p-4">
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No audit entries found" />
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Commitment</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell>{entry.adminUsername}</TableCell>
                        <TableCell className="text-sm">
                          {actionLabel(entry)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.campaignId ? (
                            <Link href={`/admin/campaigns/${entry.campaignId}`}>
                              <a className="text-primary hover:underline">
                                {entry.campaignId}
                              </a>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.commitmentId ? (
                            <Link href={`/admin/commitments/${entry.commitmentId}`}>
                              <a className="text-primary hover:underline">
                                {entry.commitmentId}
                              </a>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={entry.reason || ""}>
                          {entry.reason || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
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
