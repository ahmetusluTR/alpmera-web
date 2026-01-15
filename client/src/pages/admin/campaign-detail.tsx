import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Timeline, TimelineEvent } from "@/components/timeline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Truck, Eye, EyeOff, Send, Lock, AlertTriangle, CheckCircle, XCircle, Users, Loader2, Plus, Trash2, Edit, Save, Upload } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
];

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  rules: string;
  state: string;
  adminPublishStatus: string;
  aggregationDeadline: string;
  targetAmount: string;
  unitPrice: string;
  minCommitment: string;
  participantCount: number;
  totalCommitted: number;
  createdAt: string;
  supplierAcceptedAt: string | null;
  sku: string | null;
  productName: string | null;
  brand: string | null;
  modelNumber: string | null;
  variant: string | null;
  shortDescription: string | null;
  specs: string | null;
  variations: string | null;
  media: string | null;
  targetUnits: number | null;
  primaryImageUrl: string | null;
  galleryImageUrls: string | null;
  referencePrices: string | null;
  deliveryStrategy: string;
  deliveryCostHandling: string | null;
  supplierDirectConfirmed: boolean;
  consolidationContactName: string | null;
  consolidationCompany: string | null;
  consolidationContactEmail: string | null;
  consolidationAddressLine1: string | null;
  consolidationAddressLine2: string | null;
  consolidationCity: string | null;
  consolidationState: string | null;
  consolidationPostalCode: string | null;
  consolidationCountry: string | null;
  consolidationPhone: string | null;
  deliveryWindow: string | null;
  fulfillmentNotes: string | null;
  hasCommitments: boolean;
  commitmentCount: number;
  productId: string | null;
  supplierId: string | null;
  consolidationPointId: string | null;
  supplierName?: string;
  consolidationPointName?: string;
  productStatus?: string;
  supplierStatus?: string;
  consolidationPointStatus?: string;
}

interface SpecEntry {
  key: string;
  value: string;
}

interface VariationEntry {
  name: string;
  attributes: Record<string, string>;
}

interface MediaEntry {
  url: string;
  altText?: string;
  sortOrder: number;
}

interface ReferencePriceEntry {
  amount: number;
  currency?: string;
  source: string;
  url?: string;
  capturedAt?: string;
  note?: string;
}

interface TimelineEntry {
  id: string;
  action: string;
  newState: string | null;
  reason: string | null;
  actor: string;
  createdAt: string;
}

interface CommitmentRow {
  id: string;
  participantEmail: string;
  participantName: string;
  quantity: number;
  amount: string;
  status: string;
  createdAt: string;
}

interface AdminAction {
  actionCode: string;
  enabled: boolean;
  label: string;
}

function getAvailableActions(campaign: CampaignDetail): AdminAction[] {
  const state = campaign.state;
  const publishStatus = campaign.adminPublishStatus || "DRAFT";
  const targetMet = campaign.totalCommitted >= parseFloat(campaign.targetAmount);

  const actions: AdminAction[] = [];
  if (publishStatus === "DRAFT") {
    actions.push({ actionCode: "PUBLISH", enabled: true, label: "Publish Campaign" });
  }
  if (state === "AGGREGATION" && publishStatus === "PUBLISHED" && targetMet) {
    actions.push({ actionCode: "MARK_FUNDED", enabled: true, label: "Mark as Funded" });
  }
  if (state === "SUCCESS" && campaign.supplierAcceptedAt) {
    actions.push({ actionCode: "START_FULFILLMENT", enabled: true, label: "Start Fulfillment" });
  }
  if (state === "FULFILLMENT") {
    actions.push({ actionCode: "RELEASE_ESCROW", enabled: true, label: "Release Escrow" });
  }
  if (state !== "RELEASED" && state !== "FAILED") {
    actions.push({ actionCode: "FAIL_CAMPAIGN", enabled: true, label: "Fail Campaign" });
  }
  return actions;
}

const STATE_DISPLAY_LABELS: Record<string, string> = {
  AGGREGATION: "Active",
  SUCCESS: "Funded",
  FAILED: "Failed",
  FULFILLMENT: "Fulfillment",
  RELEASED: "Released",
};

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

function mapToTimelineEvents(entries: TimelineEntry[]): TimelineEvent[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.action === "state_transition" ? `State changed to ${entry.newState}` : entry.action,
    timestamp: entry.createdAt,
    subtitle: entry.reason || undefined,
    status: "info" as const,
    meta: [{ label: "Actor", value: entry.actor }],
    isImmutable: true,
  }));
}

export default function CampaignDetailPage() {
  const [, params] = useRoute("/admin/campaigns/:id");
  const campaignId = params?.id;
  const { toast } = useToast();
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);

  const { data: campaign, isLoading, error, refetch } = useQuery<CampaignDetail>({
    queryKey: [`/api/admin/campaigns/${campaignId}/detail`],
    enabled: !!campaignId,
  });

  // Derived status variables - safely after query declaration but before other hooks
  const publishStatus = campaign?.adminPublishStatus || "DRAFT";
  const isPublished = publishStatus !== "DRAFT";
  const isFulfillmentPhase = campaign?.state === "FULFILLMENT" || campaign?.state === "RELEASED";
  const publishBadge = PUBLISH_STATUS_BADGES[publishStatus] || { label: publishStatus, variant: "outline" as const };

  const { data: timeline } = useQuery<TimelineEntry[]>({
    queryKey: ["/api/admin/logs"],
    enabled: !!campaignId,
    select: (logs) => logs.filter((log: any) => log.campaignId === campaignId),
  });

  const { data: commitments } = useQuery<CommitmentRow[]>({
    queryKey: [`/api/admin/campaigns/${campaignId}/commitments`],
    enabled: !!campaignId,
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: suppliers } = useQuery<any[]>({
    queryKey: ["/api/admin/suppliers"],
  });

  const { data: consolidationPoints } = useQuery<any[]>({
    queryKey: ["/api/admin/consolidation-points"],
  });

  const { data: validation } = useQuery<{ ok: boolean; missing: string[] }>({
    queryKey: [`/api/admin/campaigns/${campaignId}/publish/validate`],
    enabled: !!campaignId && publishStatus === "DRAFT", // Use derived publishStatus safely here
  });

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null);

  const adminActionMutation = useMutation({
    mutationFn: async (actionCode: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/action`, { actionCode });
    },
    onSuccess: (_, actionCode) => {
      const actionLabels: Record<string, string> = {
        MARK_FUNDED: "Campaign marked as funded",
        START_FULFILLMENT: "Fulfillment started",
        RELEASE_ESCROW: "Escrow released",
        FAIL_CAMPAIGN: "Campaign marked as failed",
      };
      toast({ title: "Success", description: actionLabels[actionCode] || "Action completed" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/detail`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      setActionDialogOpen(false);
      setPendingAction(null);
    },
    onError: (error: Error) => {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleAdminAction = (action: AdminAction) => {
    if (action.actionCode === "PUBLISH") {
      setPublishDialogOpen(true);
    } else {
      setPendingAction(action);
      setActionDialogOpen(true);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/publish`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Published", description: "Campaign is now visible and joinable." });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/detail`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setPublishDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Publish", description: error.message, variant: "destructive" });
    },
  });

  const hideMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/hide`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Hidden", description: "Campaign is now hidden from public view." });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/detail`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setHideDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Hide", description: error.message, variant: "destructive" });
    },
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [specs, setSpecs] = useState<SpecEntry[]>([]);
  const [variations, setVariations] = useState<VariationEntry[]>([]);
  const [media, setMedia] = useState<MediaEntry[]>([]);

  const initializeEditData = () => {
    if (!campaign) return;
    try { setSpecs(campaign.specs ? JSON.parse(campaign.specs) : []); } catch { setSpecs([]); }
    try { setVariations(campaign.variations ? JSON.parse(campaign.variations) : []); } catch { setVariations([]); }
    try { setMedia(campaign.media ? JSON.parse(campaign.media) : []); } catch { setMedia([]); }
  };

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      return await apiRequest("PATCH", `/api/admin/campaigns/${campaignId}`, updates);
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Campaign updated successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${campaignId}/detail`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setEditingSection(null);
      setEditForm({});
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Save", description: error.message, variant: "destructive" });
    },
  });

  const timelineEvents = timeline ? mapToTimelineEvents(timeline) : [];

  const availableActions = campaign ? getAvailableActions(campaign) : [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !campaign) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Error Loading Campaign</h2>
          <p className="text-muted-foreground">{error?.message || "Campaign not found"}</p>
          <Link href="/admin/campaigns">
            <Button variant="outline">Back to Campaigns</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/campaigns">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
                <Badge className={STATE_COLORS[campaign.state]}>
                  {STATE_DISPLAY_LABELS[campaign.state] || campaign.state}
                </Badge>
                <Badge variant={publishBadge.variant}>
                  {publishBadge.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">ID: {campaign.id}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isPublished && (
              <Button
                onClick={() => {
                  initializeEditData();
                  setEditingSection("all");
                }}
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Basic Info
              </Button>
            )}

            {publishStatus === "PUBLISHED" && (
              <Button variant="outline" onClick={() => setHideDialogOpen(true)}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide from Public
              </Button>
            )}

            {publishStatus === "HIDDEN" && (
              <Button variant="outline" onClick={() => setPublishDialogOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Unhide Campaign
              </Button>
            )}

            {availableActions.map((action) => (
              <Button
                key={action.actionCode}
                onClick={() => handleAdminAction(action)}
                variant={action.actionCode === "PUBLISH" ? "default" : "outline"}
                disabled={!action.enabled || adminActionMutation.isPending}
                className={action.actionCode === "FAIL_CAMPAIGN" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
              >
                {adminActionMutation.isPending && pendingAction?.actionCode === action.actionCode && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {action.actionCode === "PUBLISH" && <Send className="h-4 w-4 mr-2" />}
                {action.actionCode === "MARK_FUNDED" && <CheckCircle className="h-4 w-4 mr-2" />}
                {action.actionCode === "START_FULFILLMENT" && <Truck className="h-4 w-4 mr-2" />}
                {action.actionCode === "RELEASE_ESCROW" && <Lock className="h-4 w-4 mr-2" />}
                {action.actionCode === "FAIL_CAMPAIGN" && <AlertTriangle className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Messaging */}
        {publishStatus === "DRAFT" && validation && !validation.ok && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Missing required fields for publishing:</p>
              <ul className="list-disc list-inside text-sm">
                {validation.missing.map(field => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Overview / Stats Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Backers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{campaign.participantCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Committed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${parseFloat(campaign.totalCommitted.toString()).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${parseFloat(campaign.targetAmount).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unit Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${parseFloat(campaign.unitPrice).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Prerequisites Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Prerequisites</CardTitle>
                  <CardDescription>Core product and logistical connections</CardDescription>
                </div>
                {!isPublished && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditForm({
                      productId: campaign.productId,
                      supplierId: campaign.supplierId,
                      consolidationPointId: campaign.consolidationPointId
                    });
                    setEditingSection("prerequisites");
                  }}>
                    <Edit className="h-3 w-3 mr-2" />
                    Link Resources
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Product Link */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Target Product</Label>
                    <div className="flex items-center justify-between border rounded-md p-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none mb-1">
                          {campaign.productId ? (
                            campaign.productName || "Linked Product"
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Unlinked
                            </span>
                          )}
                        </span>
                        {campaign.sku && <span className="text-[10px] text-muted-foreground font-mono">SKU: {campaign.sku}</span>}
                      </div>
                      {campaign.productId && (
                        <Badge variant={campaign.productStatus === "ACTIVE" ? "default" : "secondary"} className="scale-75">
                          {campaign.productStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Supplier Link */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Supplier Source</Label>
                    <div className="flex items-center justify-between border rounded-md p-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none mb-1">
                          {campaign.supplierId ? (
                            campaign.supplierName || "Linked Supplier"
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Unlinked
                            </span>
                          )}
                        </span>
                        {campaign.supplierId && <span className="text-[10px] text-muted-foreground">ID: {campaign.supplierId.split('-')[0]}...</span>}
                      </div>
                      {campaign.supplierId && (
                        <Badge variant={campaign.supplierStatus === "ACTIVE" ? "default" : "secondary"} className="scale-75">
                          {campaign.supplierStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Consolidation Link */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Delivery Hub</Label>
                    <div className="flex items-center justify-between border rounded-md p-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none mb-1">
                          {campaign.consolidationPointId ? (
                            campaign.consolidationPointName || "Linked Hub"
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Unlinked
                            </span>
                          )}
                        </span>
                        {campaign.consolidationPointId && <span className="text-[10px] text-muted-foreground">ID: {campaign.consolidationPointId.split('-')[0]}...</span>}
                      </div>
                      {campaign.consolidationPointId && (
                        <Badge variant={campaign.consolidationPointStatus === "ACTIVE" ? "default" : "secondary"} className="scale-75">
                          {campaign.consolidationPointStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Details Tabs Style Sections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Description & Rules</CardTitle>
                {!isPublished && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditForm({ title: campaign.title, description: campaign.description, rules: campaign.rules });
                    setEditingSection("description");
                  }}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Campaign Rules</h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{campaign.rules}</p>
                </div>
              </CardContent>
            </Card>

            {/* Product Specifications Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Technical Detail (Specs)</CardTitle>
                  <CardDescription>Public-facing product specifications</CardDescription>
                </div>
                {!isPublished && (
                  <Button variant="outline" size="sm" onClick={() => {
                    initializeEditData();
                    setEditingSection("specs");
                  }}>
                    <Edit className="h-3 w-3 mr-2" />
                    Manage Specs
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {(() => {
                    let specsData = [];
                    try {
                      specsData = campaign.specs ? JSON.parse(campaign.specs) : [];
                    } catch (e) {
                      console.error("Failed to parse specs", e);
                    }

                    if (!specsData.length) return <p className="text-sm text-muted-foreground italic">No specifications provided.</p>;

                    return specsData.map((spec: any, i: number) => (
                      <div key={i} className="flex justify-between border-b pb-1">
                        <span className="text-sm font-medium text-muted-foreground">{spec.key}</span>
                        <span className="text-sm">{spec.value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Price Analysis Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>MSRP & Price Reference</CardTitle>
                  <CardDescription>Comparison values shown to users</CardDescription>
                </div>
                {!isPublished && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingSection("prices");
                    let currentPrices = [];
                    try {
                      currentPrices = campaign.referencePrices ? JSON.parse(campaign.referencePrices) : [];
                    } catch { currentPrices = []; }
                    setEditForm({ referencePrices: currentPrices });
                  }}>
                    <Edit className="h-3 w-3 mr-2" />
                    Manage Prices
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    let priceData = [];
                    try {
                      priceData = campaign.referencePrices ? JSON.parse(campaign.referencePrices) : [];
                    } catch (e) {
                      priceData = [];
                    }

                    if (!priceData.length) return <p className="text-sm text-muted-foreground italic">No price references provided.</p>;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {priceData.map((price: any, i: number) => (
                          <div key={i} className="bg-muted/30 rounded-md p-3 border">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-semibold text-muted-foreground uppercase">{price.source}</span>
                              <span className="text-lg font-bold">${parseFloat(price.amount).toLocaleString()}</span>
                            </div>
                            {price.url && (
                              <a href={price.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                                View Source Link
                              </a>
                            )}
                            {price.note && <p className="text-[10px] text-muted-foreground mt-1 italic">{price.note}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Commitment List */}
            <Card>
              <CardHeader>
                <CardTitle>Commitments</CardTitle>
              </CardHeader>
              <CardContent>
                {!commitments || commitments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No commitments yet.</p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Participant</th>
                          <th className="text-right p-3 font-medium">Qty</th>
                          <th className="text-right p-3 font-medium">Amount</th>
                          <th className="text-center p-3 font-medium">Status</th>
                          <th className="text-right p-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commitments.map((c) => (
                          <tr key={c.id} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              <div className="font-medium">{c.participantName}</div>
                              <div className="text-xs text-muted-foreground">{c.participantEmail}</div>
                            </td>
                            <td className="p-3 text-right font-mono">{c.quantity}</td>
                            <td className="p-3 text-right font-mono">${parseFloat(c.amount).toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {c.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right text-xs text-muted-foreground">
                              {format(new Date(c.createdAt), "MMM d, HH:mm")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Section (Dynamic) */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Strategy
                  </CardTitle>
                  {!isFulfillmentPhase && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditForm({
                        deliveryStrategy: campaign.deliveryStrategy,
                        deliveryCostHandling: campaign.deliveryCostHandling,
                        deliveryWindow: campaign.deliveryWindow,
                        fulfillmentNotes: campaign.fulfillmentNotes
                      });
                      setEditingSection("delivery");
                    }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">STRATEGY</Label>
                  <p className="text-sm font-semibold">{campaign.deliveryStrategy === "SUPPLIER_DIRECT" ? "Supplier Direct to Customer" : "Consolidation Hub"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">COST HANDLING</Label>
                  <p className="text-sm">{campaign.deliveryCostHandling === "INCLUDED_IN_UNIT_PRICE" ? "Included in Unit Price" : campaign.deliveryCostHandling === "SEPARATE_POST_CAMPAIGN" ? "Billed separately after campaign" : "Free Shipping (Supplier covered)"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">EST. DELIVERY WINDOW</Label>
                  <p className="text-sm font-mono border-l-2 pl-2 border-primary/20">{campaign.deliveryWindow || "TBD - Set before fulfillment"}</p>
                </div>
                {campaign.fulfillmentNotes && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">INTERNAL FULFILLMENT NOTES</Label>
                    <p className="text-xs text-muted-foreground italic h-16 overflow-y-auto bg-muted/50 p-2 rounded">
                      {campaign.fulfillmentNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline / Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign History</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline
                  events={timelineEvents}
                  className="max-h-[500px] overflow-y-auto pr-2"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs and Modals */}

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.actionCode === "FAIL_CAMPAIGN"
                ? "This will mark the campaign as FAILED and notify participants. This action cannot be undone."
                : `You are about to perform: ${pendingAction?.label}. This will update the campaign state.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={pendingAction?.actionCode === "FAIL_CAMPAIGN" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => pendingAction && adminActionMutation.mutate(pendingAction.actionCode)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Publish Campaign?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will make the campaign public and start accepting commitments. Ensure all pricing, specs, and delivery details are correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hide Confirmation Dialog */}
      <AlertDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-destructive" />
              Hide Campaign?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the campaign from the public UI. Existing commitments will still be visible to admins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => hideMutation.mutate()}
              disabled={hideMutation.isPending}
            >
              {hideMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hide Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Edit Dialog */}
      <Dialog open={editingSection !== null} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign Details</DialogTitle>
            <DialogDescription>
              Updates made here will take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {editingSection === "description" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input id="title" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Public Description</Label>
                  <Textarea id="description" rows={6} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rules">Campaign Rules</Label>
                  <Textarea id="rules" rows={4} value={editForm.rules} onChange={e => setEditForm({ ...editForm, rules: e.target.value })} />
                </div>
              </>
            )}

            {editingSection === "prerequisites" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Linked Product</Label>
                  <Select value={editForm.productId || ""} onValueChange={v => setEditForm({ ...editForm, productId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product from catalog" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Supplier</Label>
                  <Select value={editForm.supplierId || ""} onValueChange={v => setEditForm({ ...editForm, supplierId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.region})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Consolidation Point</Label>
                  <Select value={editForm.consolidationPointId || ""} onValueChange={v => setEditForm({ ...editForm, consolidationPointId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fulfillment hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {consolidationPoints?.map(cp => (
                        <SelectItem key={cp.id} value={cp.id}>{cp.name} - {cp.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {editingSection === "specs" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Technical Specifications</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSpecs([...specs, { key: "", value: "" }])}>
                    <Plus className="h-3 w-3 mr-1" /> Add Row
                  </Button>
                </div>
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Key (e.g. Weight)" value={spec.key} onChange={e => {
                      const n = [...specs];
                      n[i].key = e.target.value;
                      setSpecs(n);
                    }} />
                    <Input placeholder="Value (e.g. 500g)" value={spec.value} onChange={e => {
                      const n = [...specs];
                      n[i].value = e.target.value;
                      setSpecs(n);
                    }} />
                    <Button variant="ghost" size="icon" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {editingSection === "prices" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Reference Prices</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const current = editForm.referencePrices || [];
                    setEditForm({ ...editForm, referencePrices: [...current, { amount: 0, source: "OTHER", note: "" }] });
                  }}>
                    <Plus className="h-3 w-3 mr-1" /> Add Reference
                  </Button>
                </div>
                {(editForm.referencePrices || []).map((price: any, i: number) => (
                  <div key={i} className="p-4 border rounded-md space-y-3 relative">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => {
                      const next = [...editForm.referencePrices];
                      next.splice(i, 1);
                      setEditForm({ ...editForm, referencePrices: next });
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <Input type="number" step="0.01" value={price.amount} onChange={e => {
                          const next = [...editForm.referencePrices];
                          next[i].amount = parseFloat(e.target.value);
                          setEditForm({ ...editForm, referencePrices: next });
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Source Type</Label>
                        <Select value={price.source} onValueChange={v => {
                          const next = [...editForm.referencePrices];
                          next[i].source = v;
                          setEditForm({ ...editForm, referencePrices: next });
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MSRP">MSRP</SelectItem>
                            <SelectItem value="RETAILER_LISTING">Retailer listing</SelectItem>
                            <SelectItem value="SUPPLIER_QUOTE">Supplier quote</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL (Optional)</Label>
                      <Input value={price.url || ""} onChange={e => {
                        const next = [...editForm.referencePrices];
                        next[i].url = e.target.value;
                        setEditForm({ ...editForm, referencePrices: next });
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
            <Button onClick={() => {
              const updates = { ...editForm };
              if (editingSection === "specs") updates.specs = JSON.stringify(specs.filter(s => s.key && s.value));
              if (editingSection === "prices") updates.referencePrices = JSON.stringify(editForm.referencePrices);
              saveMutation.mutate(updates);
            }} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
