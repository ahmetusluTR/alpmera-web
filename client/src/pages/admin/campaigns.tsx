import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search, RefreshCw, ArrowUp, ArrowDown, Plus, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CampaignListItem {
  id: string;
  title: string;
  state: string;
  adminPublishStatus: string;
  aggregationDeadline: string;
  participantCount: number;
  totalCommitted: number;
  createdAt: string;
}

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-blue-500 text-white",
  SUCCESS: "bg-green-600 text-white",
  FAILED: "bg-red-500 text-white",
  FULFILLMENT: "bg-amber-500 text-white",
  RELEASED: "bg-green-700 text-white",
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
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateCampaignForm>(initialFormState);

  const { data: campaigns, isLoading, error, refetch } = useQuery<CampaignListItem[]>({
    queryKey: ["/api/admin/campaigns"],
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

  const filteredCampaigns = campaigns
    ?.filter((c) => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (publishFilter !== "all" && (c.adminPublishStatus || "DRAFT") !== publishFilter) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === "deadline") {
        cmp = new Date(a.aggregationDeadline).getTime() - new Date(b.aggregationDeadline).getTime();
      } else if (sortBy === "commitments") {
        cmp = a.participantCount - b.participantCount;
      }
      return sortDir === "desc" ? -cmp : cmp;
    }) || [];

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  };

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
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-campaigns"
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-state-filter">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="AGGREGATION">Aggregation</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="FULFILLMENT">Fulfillment</SelectItem>
              <SelectItem value="RELEASED">Released</SelectItem>
            </SelectContent>
          </Select>
          <Select value={publishFilter} onValueChange={setPublishFilter}>
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="commitments">Commitments</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDir}
            data-testid="button-sort-dir"
          >
            {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
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
                <p className="text-muted-foreground mb-4">Unable to load campaigns.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No campaigns found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Publish</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Commitments</TableHead>
                      <TableHead className="text-right">Escrow Locked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => {
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
                            {campaign.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant={publishBadge.variant} className="text-xs">
                              {publishBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATE_COLORS[campaign.state] || "bg-muted"}>
                              {campaign.state}
                            </Badge>
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
