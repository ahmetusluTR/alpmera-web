import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";
import { useAdminListEngine } from "@/lib/admin-list-engine";

interface ExceptionEntry {
  id: string;
  status: string;
  createdAt: string;
  summary: string;
}

export default function ExceptionsPage() {
  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<ExceptionEntry>({
    endpoint: "/api/admin/exceptions",
    initialPageSize: 25,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Exceptions</h1>
          <p className="text-muted-foreground text-sm">Handle edge cases and manual interventions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search exceptions"
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
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4">
                <ListSkeleton rows={6} columns={4} />
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">Unable to load exceptions.</p>
                <p className="text-muted-foreground text-sm">
                  {error instanceof Error ? error.message : "Failed to load exceptions"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <div className="p-4">
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No exceptions found" />
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
