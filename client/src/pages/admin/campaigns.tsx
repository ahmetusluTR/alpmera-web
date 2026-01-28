import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Plus, Loader2, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAdminListEngine } from "@/lib/admin-list-engine";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListEmptyState, ListMismatchBanner, ListSkeleton } from "@/components/admin/list-state";

interface CampaignListItem {
  id: string;
  title: string;
  state: string;
  adminPublishStatus: string;
  aggregationDeadline: string;
  participantCount: number;
  totalCommitted: number;
  createdAt: string;
  updatedAt?: string;
  productId?: string | null;
  supplierId?: string | null;
  consolidationPointId?: string | null;
  productName?: string;
  supplierName?: string;
  consolidationPointName?: string;
  productStatus?: string;
  supplierStatus?: string;
  consolidationPointStatus?: string;
}

// Map internal states to spec terminology for display
const STATE_DISPLAY_LABELS: Record<string, string> = {
  AGGREGATION: "Active",
  SUCCESS: "Funded",
  PROCUREMENT: "Processing",
  FULFILLMENT: "Fulfillment",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-blue-500 text-white",
  SUCCESS: "bg-green-600 text-white",
  PROCUREMENT: "bg-orange-500 text-white",
  FULFILLMENT: "bg-amber-500 text-white",
  COMPLETED: "bg-green-700 text-white",
  FAILED: "bg-red-500 text-white",
};

const PUBLISH_STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "default" },
  HIDDEN: { label: "Hidden", variant: "destructive" },
};

interface CreateCampaignForm {
  title: string;
  aggregationDeadline: string;
  sku: string;
  productName: string;
  deliveryStrategy: string;
  targetAmount: string;
  unitPrice: string;
  minCommitment: string;
  consolidationContactName: string;
  consolidationAddressLine1: string;
  consolidationAddressLine2: string;
  consolidationCity: string;
  consolidationState: string;
  consolidationPostalCode: string;
  consolidationCountry: string;
  consolidationPhone: string;
}

const initialFormState: CreateCampaignForm = {
  title: "",
  aggregationDeadline: format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
  sku: "",
  productName: "",
  deliveryStrategy: "SUPPLIER_DIRECT",
  targetAmount: "10000",
  unitPrice: "100",
  minCommitment: "100",
  consolidationContactName: "",
  consolidationAddressLine1: "",
  consolidationAddressLine2: "",
  consolidationCity: "",
  consolidationState: "",
  consolidationPostalCode: "",
  consolidationCountry: "USA",
  consolidationPhone: "",
};

export default function CampaignsListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateCampaignForm>(initialFormState);

  const { rows, total, page, pageSize, isLoading, error, controls } = useAdminListEngine<CampaignListItem>({
    endpoint: "/api/admin/campaigns",
    initialPageSize: 25,
    initialStatus: "all",
    initialSort: "created_desc",
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCampaignForm) => {
      return await apiRequest("POST", "/api/admin/campaigns", {
        title: data.title,
        description: `Campaign for ${data.productName}`,
        rules: "Standard campaign rules apply.",
        targetAmount: data.targetAmount,
        unitPrice: data.unitPrice,
        minCommitment: data.minCommitment,
        aggregationDeadline: new Date(data.aggregationDeadline).toISOString(),
        sku: data.sku,
        productName: data.productName,
        deliveryStrategy: data.deliveryStrategy,
        ...(data.deliveryStrategy === "BULK_TO_CONSOLIDATION" && {
          consolidationContactName: data.consolidationContactName,
          consolidationAddressLine1: data.consolidationAddressLine1,
          consolidationAddressLine2: data.consolidationAddressLine2,
          consolidationCity: data.consolidationCity,
          consolidationState: data.consolidationState,
          consolidationPostalCode: data.consolidationPostalCode,
          consolidationCountry: data.consolidationCountry,
          consolidationPhone: data.consolidationPhone,
        }),
      });
    },
    onSuccess: (result: any) => {
      toast({ title: "Campaign Created", description: "Campaign created as DRAFT." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setCreateDialogOpen(false);
      setForm(initialFormState);
      if (result?.id) {
        setLocation(`/admin/campaigns/${result.id}`);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Create", description: error.message, variant: "destructive" });
    },
  });

  const handleRowClick = (campaignId: string) => {
    setLocation(`/admin/campaigns/${campaignId}`);
  };

  const updateForm = (field: keyof CreateCampaignForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.sku.trim() || !form.productName.trim()) {
      toast({ title: "Validation Error", description: "Title, SKU, and Product Name are required.", variant: "destructive" });
      return;
    }
    if (form.deliveryStrategy === "BULK_TO_CONSOLIDATION") {
      if (!form.consolidationContactName || !form.consolidationAddressLine1 || !form.consolidationCity || !form.consolidationState || !form.consolidationPostalCode) {
        toast({ title: "Validation Error", description: "Consolidation address is required for bulk delivery.", variant: "destructive" });
        return;
      }
    }
    createMutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-campaigns-heading">Campaigns</h1>
            <p className="text-muted-foreground text-sm">Manage campaign lifecycle and commitments</p>
          </div>
          <Link href="/admin/campaigns/new">
            <Button data-testid="button-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent>
            <ListToolbar
              searchValue={controls.searchInput}
              onSearchChange={controls.setSearchInput}
              searchPlaceholder="Search by name or ID"
              statusValue={controls.status}
              onStatusChange={controls.setStatus}
              statusOptions={[
                { value: "all", label: "All States" },
                { value: "AGGREGATION", label: "Active" },
                { value: "SUCCESS", label: "Funded" },
                { value: "PROCUREMENT", label: "Processing" },
                { value: "FULFILLMENT", label: "Fulfillment" },
                { value: "COMPLETED", label: "Completed" },
                { value: "FAILED", label: "Failed" },
              ]}
              createdFrom={controls.createdFrom}
              createdTo={controls.createdTo}
              onCreatedFromChange={controls.setCreatedFrom}
              onCreatedToChange={controls.setCreatedTo}
              pageSize={controls.pageSize}
              onPageSizeChange={(value) => controls.setPageSize(value)}
              onClearFilters={controls.resetFilters}
              extraFilters={
                <>
                  <Select
                    value={controls.extraFilters.publishStatus || "all"}
                    onValueChange={(value) =>
                      controls.setExtraFilters({ ...controls.extraFilters, publishStatus: value })
                    }
                  >
                    <SelectTrigger className="w-[150px]" data-testid="select-publish-filter">
                      <SelectValue placeholder="Publish Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="HIDDEN">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={controls.extraFilters.prerequisite || "all"}
                    onValueChange={(value) =>
                      controls.setExtraFilters({ ...controls.extraFilters, prerequisite: value })
                    }
                  >
                    <SelectTrigger className="w-[170px]" data-testid="select-prerequisite-filter">
                      <SelectValue placeholder="Prerequisites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Check: All</SelectItem>
                      <SelectItem value="incomplete">Check: Incomplete</SelectItem>
                      <SelectItem value="ready">Check: Ready</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={controls.sort}
                    onValueChange={controls.setSort}
                  >
                    <SelectTrigger className="w-[170px]" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="deadline_asc">Deadline (Soonest)</SelectItem>
                      <SelectItem value="deadline_desc">Deadline (Latest)</SelectItem>
                      <SelectItem value="commitments_desc">Commitments (High)</SelectItem>
                      <SelectItem value="commitments_asc">Commitments (Low)</SelectItem>
                      <SelectItem value="escrow_desc">Escrow (High)</SelectItem>
                      <SelectItem value="escrow_asc">Escrow (Low)</SelectItem>
                      <SelectItem value="created_desc">Created (Newest)</SelectItem>
                      <SelectItem value="created_asc">Created (Oldest)</SelectItem>
                      <SelectItem value="state_asc">Lifecycle (A-Z)</SelectItem>
                      <SelectItem value="state_desc">Lifecycle (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <ListSkeleton rows={6} columns={7} />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load campaigns.</p>
                <p className="text-muted-foreground text-sm">
                  {error instanceof Error ? error.message : "Failed to load campaigns"}
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-4">
                <ListMismatchBanner total={total} />
                <ListEmptyState title="No campaigns found" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Publish</TableHead>
                      <TableHead>Lifecycle</TableHead>
                      <TableHead>Prerequisites (P/S/C)</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Commitments</TableHead>
                      <TableHead className="text-right">Escrow Locked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((campaign) => {
                      const publishStatus = campaign.adminPublishStatus || "DRAFT";
                      const publishBadge = PUBLISH_STATUS_BADGES[publishStatus] || { label: publishStatus, variant: "outline" as const };
                      return (
                        <TableRow
                          key={campaign.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleRowClick(campaign.id)}
                          data-testid={`row-campaign-${campaign.id}`}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            <div className="flex items-center gap-2">
                              {campaign.title}
                              {publishStatus === "DRAFT" && (!campaign.productId || !campaign.supplierId || !campaign.consolidationPointId) && (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={publishBadge.variant} className="text-xs">
                              {publishBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATE_COLORS[campaign.state] || "bg-muted"}>
                              {STATE_DISPLAY_LABELS[campaign.state] || campaign.state}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="flex flex-col gap-1 text-[11px]">
                              <div className="flex items-center gap-1.5 truncate">
                                <Badge variant="outline" className={`h-4 px-1 text-[10px] ${!campaign.productId ? "border-amber-500 text-amber-600" : (campaign.productStatus === "ARCHIVED" ? "border-red-500 text-red-600" : "border-green-500 text-green-600")}`}>
                                  P
                                </Badge>
                                <span className={!campaign.productId ? "text-muted-foreground italic" : (campaign.productStatus === "ARCHIVED" ? "line-through text-red-500" : "")}>
                                  {campaign.productName || "Missing"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Badge variant="outline" className={`h-4 px-1 text-[10px] ${!campaign.supplierId ? "border-amber-500 text-amber-600" : (campaign.supplierStatus === "ARCHIVED" || campaign.supplierStatus === "INACTIVE" ? "border-red-500 text-red-600" : "border-green-500 text-green-600")}`}>
                                  S
                                </Badge>
                                <span className={!campaign.supplierId ? "text-muted-foreground italic" : (campaign.supplierStatus === "ARCHIVED" || campaign.supplierStatus === "INACTIVE" ? "line-through text-red-500" : "")}>
                                  {campaign.supplierName || "Missing"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Badge variant="outline" className={`h-4 px-1 text-[10px] ${!campaign.consolidationPointId ? "border-amber-500 text-amber-600" : (campaign.consolidationPointStatus === "ARCHIVED" || campaign.consolidationPointStatus === "INACTIVE" ? "border-red-500 text-red-600" : "border-green-500 text-green-600")}`}>
                                  C
                                </Badge>
                                <span className={!campaign.consolidationPointId ? "text-muted-foreground italic" : (campaign.consolidationPointStatus === "ARCHIVED" || campaign.consolidationPointStatus === "INACTIVE" ? "line-through text-red-500" : "")}>
                                  {campaign.consolidationPointName || "Missing"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(campaign.aggregationDeadline), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {campaign.participantCount}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${campaign.totalCommitted.toLocaleString()}
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign as DRAFT. You can publish it later when ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Name *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g., Spring Solar Panel Group Buy"
                data-testid="input-campaign-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => updateForm("sku", e.target.value)}
                  placeholder="e.g., SOLAR-PANEL-400W"
                  data-testid="input-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={form.productName}
                  onChange={(e) => updateForm("productName", e.target.value)}
                  placeholder="e.g., 400W Solar Panel"
                  data-testid="input-product-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Aggregation Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={form.aggregationDeadline}
                onChange={(e) => updateForm("aggregationDeadline", e.target.value)}
                data-testid="input-deadline"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => updateForm("targetAmount", e.target.value)}
                  data-testid="input-target-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => updateForm("unitPrice", e.target.value)}
                  data-testid="input-unit-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minCommitment">Min Commitment</Label>
                <Input
                  id="minCommitment"
                  type="number"
                  value={form.minCommitment}
                  onChange={(e) => updateForm("minCommitment", e.target.value)}
                  data-testid="input-min-commitment"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryStrategy">Delivery Strategy *</Label>
              <Select value={form.deliveryStrategy} onValueChange={(v) => updateForm("deliveryStrategy", v)}>
                <SelectTrigger data-testid="select-delivery-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER_DIRECT">Supplier Direct (ship to each participant)</SelectItem>
                  <SelectItem value="BULK_TO_CONSOLIDATION">Bulk to Consolidation (ship to one location)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.deliveryStrategy === "BULK_TO_CONSOLIDATION" && (
              <>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-3">Consolidation Address</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="consolidationContactName">Contact Name *</Label>
                      <Input
                        id="consolidationContactName"
                        value={form.consolidationContactName}
                        onChange={(e) => updateForm("consolidationContactName", e.target.value)}
                        data-testid="input-consolidation-contact"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consolidationAddressLine1">Address Line 1 *</Label>
                      <Input
                        id="consolidationAddressLine1"
                        value={form.consolidationAddressLine1}
                        onChange={(e) => updateForm("consolidationAddressLine1", e.target.value)}
                        data-testid="input-consolidation-address1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consolidationAddressLine2">Address Line 2</Label>
                      <Input
                        id="consolidationAddressLine2"
                        value={form.consolidationAddressLine2}
                        onChange={(e) => updateForm("consolidationAddressLine2", e.target.value)}
                        data-testid="input-consolidation-address2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consolidationCity">City *</Label>
                        <Input
                          id="consolidationCity"
                          value={form.consolidationCity}
                          onChange={(e) => updateForm("consolidationCity", e.target.value)}
                          data-testid="input-consolidation-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consolidationState">State *</Label>
                        <Input
                          id="consolidationState"
                          value={form.consolidationState}
                          onChange={(e) => updateForm("consolidationState", e.target.value)}
                          data-testid="input-consolidation-state"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consolidationPostalCode">Postal Code *</Label>
                        <Input
                          id="consolidationPostalCode"
                          value={form.consolidationPostalCode}
                          onChange={(e) => updateForm("consolidationPostalCode", e.target.value)}
                          data-testid="input-consolidation-postal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consolidationCountry">Country</Label>
                        <Input
                          id="consolidationCountry"
                          value={form.consolidationCountry}
                          onChange={(e) => updateForm("consolidationCountry", e.target.value)}
                          data-testid="input-consolidation-country"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consolidationPhone">Phone</Label>
                      <Input
                        id="consolidationPhone"
                        value={form.consolidationPhone}
                        onChange={(e) => updateForm("consolidationPhone", e.target.value)}
                        data-testid="input-consolidation-phone"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
