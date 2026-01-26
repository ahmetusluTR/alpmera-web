import { useMemo } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";

interface DeliveryItem {
  campaignId: string;
  campaignName: string;
  deliveryStrategy: string;
  status: string;
  lastUpdateAt: string | null;
  nextUpdateDueAt: string | null;
  isOverdue: boolean;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "outline" },
};

const SORT_OPTIONS = [
  { value: "campaign_asc", label: "Campaign (A-Z)" },
  { value: "campaign_desc", label: "Campaign (Z-A)" },
  { value: "status_asc", label: "Status (A-Z)" },
  { value: "status_desc", label: "Status (Z-A)" },
  { value: "last_update_desc", label: "Last Update (Newest)" },
  { value: "last_update_asc", label: "Last Update (Oldest)" },
];

export default function DeliveriesPage() {
  const [, setLocation] = useLocation();
  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<DeliveryItem>({
    endpoint: "/api/admin/deliveries",
    initialPageSize: 25,
    initialStatus: "ALL",
    initialSort: "campaign_asc",
  });

  const handleRowClick = (campaignId: string) => {
    setLocation(`/admin/campaigns/${campaignId}/fulfillment`);
  };

  const overdueOnly = controls.extraFilters.overdueOnly === "true";

  const statusBadges = useMemo(() => STATUS_BADGES, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-deliveries-heading">Deliveries</h1>
          <p className="text-muted-foreground text-sm">
            Track fulfillment progress across campaigns. Click a row to manage fulfillment updates.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search campaigns"
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
                <>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={controls.sort}
                    onChange={(e) => controls.setSort(e.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="overdue-only"
                      checked={overdueOnly}
                      onCheckedChange={(checked) =>
                        controls.setExtraFilters({
                          ...controls.extraFilters,
                          overdueOnly: checked === true ? "true" : "",
                        })
                      }
                    />
                    <Label htmlFor="overdue-only" className="text-sm">
                      Overdue only
                    </Label>
                  </div>
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
                <p className="text-muted-foreground mb-2">Unable to load deliveries.</p>
                <p className="text-muted-foreground text-sm">
                  {error instanceof Error ? error.message : "Failed to load deliveries"}
                </p>
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <div className="p-4">
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No deliveries found" />
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((delivery) => {
                      return (
                        <TableRow
                          key={delivery.campaignId}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleRowClick(delivery.campaignId)}
                          data-testid={`delivery-row-${delivery.campaignId}`}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {delivery.isOverdue && (
                              <StatusBadge status="OVERDUE" mapping={{ OVERDUE: { label: "Overdue", variant: "secondary" } }} />
                            )}
                            {delivery.campaignName}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={delivery.deliveryStrategy} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={delivery.status} mapping={statusBadges} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {delivery.lastUpdateAt
                              ? format(new Date(delivery.lastUpdateAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {delivery.nextUpdateDueAt
                              ? format(new Date(delivery.nextUpdateDueAt), "MMM d, yyyy")
                              : "-"}
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
