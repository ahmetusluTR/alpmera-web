import { Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";
import { User, CreditCard, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Participant {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
}

export default function ParticipantsPage() {
  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<Participant>({
    endpoint: "/api/admin/participants",
    initialPageSize: 25,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view participant accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search by participant ID or email"
              createdFrom={controls.createdFrom}
              createdTo={controls.createdTo}
              onCreatedFromChange={controls.setCreatedFrom}
              onCreatedToChange={controls.setCreatedTo}
              pageSize={controls.pageSize}
              onPageSizeChange={(value) => controls.setPageSize(value)}
              onClearFilters={controls.resetFilters}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Participants
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({total} total)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <ListSkeleton rows={6} columns={6} />
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">Error loading participants</p>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load participants"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <>
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No participants found" />
              </>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-mono text-sm">
                          {participant.id}
                        </TableCell>
                        <TableCell>
                          {participant.fullName || (
                            <span className="text-muted-foreground italic">
                              No name
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>
                          {participant.phoneNumber || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(participant.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/participants/${participant.id}`}>
                              <Button variant="outline" size="sm">
                                <User className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/participants/${participant.id}/credits`}>
                              <Button variant="outline" size="sm">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Credits
                              </Button>
                            </Link>
                            <Link href={`/admin/participants/${participant.id}`}>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Commitments
                              </Button>
                            </Link>
                            <Link href={`/admin/participants/${participant.id}`}>
                              <Button variant="outline" size="sm">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Refunds
                              </Button>
                            </Link>
                          </div>
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
