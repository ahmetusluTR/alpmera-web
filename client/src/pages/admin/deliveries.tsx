import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Search, RefreshCw } from "lucide-react";
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

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "outline" },
  DELAYED: { label: "Delayed", variant: "destructive" },
};

export default function DeliveriesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const { data: deliveries, isLoading, error, refetch } = useQuery<DeliveryItem[]>({
    queryKey: ["/api/admin/deliveries"],
  });

  const filteredDeliveries = deliveries
    ?.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (showOverdueOnly && !d.isOverdue) return false;
      if (search && !d.campaignName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return 0;
    }) || [];

  const handleRowClick = (campaignId: string) => {
    setLocation(`/admin/campaigns/${campaignId}/fulfillment`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-deliveries-heading">Deliveries</h1>
          <p className="text-muted-foreground text-sm">Track fulfillment progress across campaigns</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-deliveries"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DELAYED">Delayed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="overdue"
              checked={showOverdueOnly}
              onCheckedChange={(checked) => setShowOverdueOnly(checked === true)}
              data-testid="checkbox-overdue"
            />
            <Label htmlFor="overdue" className="text-sm">Overdue only</Label>
          </div>
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
                <p className="text-muted-foreground mb-4">Unable to load deliveries.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No deliveries found.</p>
            ) : (
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
                    {filteredDeliveries.map((delivery) => {
                      const statusBadge = STATUS_BADGES[delivery.status] || { label: delivery.status, variant: "outline" as const };
                      return (
                        <TableRow
                          key={delivery.campaignId}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleRowClick(delivery.campaignId)}
                          data-testid={`delivery-row-${delivery.campaignId}`}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {delivery.isOverdue && (
                              <Badge variant="destructive" className="mr-2">Overdue</Badge>
                            )}
                            {delivery.campaignName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{delivery.deliveryStrategy}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
