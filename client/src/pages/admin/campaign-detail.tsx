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
  // Product Details
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
  // Delivery
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
  // Edit permissions
  hasCommitments: boolean;
  commitmentCount: number;
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

// Helper to determine available admin actions based on campaign state
function getAvailableActions(campaign: CampaignDetail): AdminAction[] {
  const state = campaign.state;
  const publishStatus = campaign.adminPublishStatus || "DRAFT";
  const hasCommitments = campaign.hasCommitments;
  const targetMet = campaign.totalCommitted >= parseFloat(campaign.targetAmount);

  const actions: AdminAction[] = [];

  // PUBLISH: Only available in DRAFT
  if (publishStatus === "DRAFT") {
    actions.push({ actionCode: "PUBLISH", enabled: true, label: "Publish Campaign" });
  }

  // MARK_FUNDED: Available when AGGREGATION + target met
  if (state === "AGGREGATION" && publishStatus === "PUBLISHED" && targetMet) {
    actions.push({ actionCode: "MARK_FUNDED", enabled: true, label: "Mark as Funded" });
  }

  // START_FULFILLMENT: Available when SUCCESS (funded) and supplier accepted
  if (state === "SUCCESS" && campaign.supplierAcceptedAt) {
    actions.push({ actionCode: "START_FULFILLMENT", enabled: true, label: "Start Fulfillment" });
  }

  // RELEASE_ESCROW: Available when FULFILLMENT
  if (state === "FULFILLMENT") {
    actions.push({ actionCode: "RELEASE_ESCROW", enabled: true, label: "Release Escrow" });
  }

  // FAIL_CAMPAIGN: Available before RELEASED
  if (state !== "RELEASED" && state !== "FAILED") {
    actions.push({ actionCode: "FAIL_CAMPAIGN", enabled: true, label: "Fail Campaign" });
  }

  return actions;
}

// Map internal states to spec terminology
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

  const { data: timeline } = useQuery<TimelineEntry[]>({
    queryKey: ["/api/admin/logs"],
    enabled: !!campaignId,
    select: (logs) => logs.filter((log: any) => log.campaignId === campaignId),
  });

  const { data: commitments } = useQuery<CommitmentRow[]>({
    queryKey: [`/api/admin/campaigns/${campaignId}/commitments`],
    enabled: !!campaignId,
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
    } else if (action.actionCode === "FAIL_CAMPAIGN") {
      setPendingAction(action);
      setActionDialogOpen(true);
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

  // Editable state for DRAFT campaigns
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [specs, setSpecs] = useState<SpecEntry[]>([]);
  const [variations, setVariations] = useState<VariationEntry[]>([]);
  const [media, setMedia] = useState<MediaEntry[]>([]);

  // Initialize editable data from campaign
  const initializeEditData = () => {
    if (!campaign) return;
    try {
      setSpecs(campaign.specs ? JSON.parse(campaign.specs) : []);
    } catch { setSpecs([]); }
    try {
      setVariations(campaign.variations ? JSON.parse(campaign.variations) : []);
    } catch { setVariations([]); }
    try {
      setMedia(campaign.media ? JSON.parse(campaign.media) : []);
    } catch { setMedia([]); }
  };

  // Save mutation for updating campaign fields
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
  
  const publishStatus = campaign?.adminPublishStatus || "DRAFT";
  const isPublished = publishStatus !== "DRAFT";
  const isFulfillmentPhase = campaign?.state === "FULFILLMENT" || campaign?.state === "RELEASED";
  const publishBadge = PUBLISH_STATUS_BADGES[publishStatus] || { label: publishStatus, variant: "outline" as const };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold truncate" data-testid="text-campaign-title">
              {isLoading ? <Skeleton className="h-8 w-48" /> : campaign?.title || "Campaign"}
            </h1>
            {campaign && (
              <p className="text-sm text-muted-foreground font-mono">{campaign.id}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {campaign && (
              <>
                <Badge variant={publishBadge.variant} data-testid="badge-publish-status">
                  {publishBadge.label}
                </Badge>
                <Badge className={STATE_COLORS[campaign.state] || "bg-muted"} data-testid="badge-campaign-state">
                  {STATE_DISPLAY_LABELS[campaign.state] || campaign.state}
                </Badge>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Unable to load campaign.</p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : campaign ? (
          <>
            {isPublished && (
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-md border">
                <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    {isFulfillmentPhase 
                      ? "Fulfillment started; delivery settings are locked."
                      : "This campaign is published; core fields are locked."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFulfillmentPhase
                      ? "All campaign fields are now read-only."
                      : "Only consolidation and delivery fields can be edited."}
                  </p>
                </div>
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Publish Controls</CardTitle>
                  <CardDescription>
                    Control campaign visibility and joinability
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {publishStatus === "DRAFT" && (
                    <Button onClick={() => setPublishDialogOpen(true)} data-testid="button-publish">
                      <Send className="w-4 h-4 mr-2" />
                      Publish Campaign
                    </Button>
                  )}
                  {publishStatus === "PUBLISHED" && (
                    <Button variant="outline" onClick={() => setHideDialogOpen(true)} data-testid="button-hide">
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Campaign
                    </Button>
                  )}
                  {publishStatus === "HIDDEN" && (
                    <Button onClick={() => setPublishDialogOpen(true)} data-testid="button-republish">
                      <Eye className="w-4 h-4 mr-2" />
                      Republish Campaign
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Campaign Metadata - Editable in DRAFT */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Campaign Metadata</CardTitle>
                  <CardDescription>
                    {!isPublished ? "Edit campaign details below" : "Core fields are locked after publishing"}
                  </CardDescription>
                </div>
                {!isPublished && editingSection !== "metadata" && (
                  <Button onClick={() => {
                    setEditingSection("metadata");
                    setEditForm({
                      title: campaign.title,
                      description: campaign.description || "",
                      sku: campaign.sku || "",
                      productName: campaign.productName || "",
                      targetUnits: campaign.targetUnits || Math.floor(parseFloat(campaign.targetAmount) / parseFloat(campaign.unitPrice)),
                      unitPrice: campaign.unitPrice,
                    });
                  }} data-testid="button-edit-metadata">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Campaign
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editingSection === "metadata" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Campaign Name *</Label>
                      <Input
                        id="edit-title"
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        data-testid="input-edit-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={3}
                        data-testid="input-edit-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-sku">SKU</Label>
                        <Input
                          id="edit-sku"
                          value={editForm.sku || ""}
                          onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                          data-testid="input-edit-sku"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-product-name">Product Name</Label>
                        <Input
                          id="edit-product-name"
                          value={editForm.productName || ""}
                          onChange={(e) => setEditForm({...editForm, productName: e.target.value})}
                          data-testid="input-edit-product-name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-target-units">Target Units *</Label>
                        <Input
                          id="edit-target-units"
                          type="number"
                          value={editForm.targetUnits || ""}
                          onChange={(e) => setEditForm({...editForm, targetUnits: parseInt(e.target.value) || 0})}
                          data-testid="input-edit-target-units"
                        />
                        <p className="text-xs text-muted-foreground">Number of units to reach for campaign success</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-unit-price">Unit Price ($)</Label>
                        <Input
                          id="edit-unit-price"
                          type="number"
                          step="0.01"
                          value={editForm.unitPrice || ""}
                          onChange={(e) => setEditForm({...editForm, unitPrice: e.target.value})}
                          data-testid="input-edit-unit-price"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => saveMutation.mutate({
                          title: editForm.title,
                          description: editForm.description,
                          sku: editForm.sku,
                          productName: editForm.productName,
                          targetUnits: editForm.targetUnits,
                          unitPrice: editForm.unitPrice,
                        })}
                        disabled={saveMutation.isPending}
                        data-testid="button-save-metadata"
                      >
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingSection(null); setEditForm({}); }} data-testid="button-cancel-metadata">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Campaign Name</p>
                      <p className="font-medium">{campaign.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">SKU</p>
                      <p className="font-mono">{campaign.sku || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Product Name</p>
                      <p className="font-medium">{campaign.productName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Unit Price</p>
                      <p className="font-mono">${parseFloat(campaign.unitPrice).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Target Units</p>
                      <p className="font-mono">{campaign.targetUnits?.toLocaleString() || "—"}</p>
                    </div>
                    {campaign.description && (
                      <div className="col-span-4 md:col-span-3">
                        <p className="text-muted-foreground text-xs mb-1">Description</p>
                        <p className="text-sm">{campaign.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Commitments</p>
                    <p className="text-xl font-mono font-semibold" data-testid="stat-participants">
                      {campaign.participantCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Escrow Locked</p>
                    <p className="text-xl font-mono font-semibold" data-testid="stat-escrow">
                      ${campaign.totalCommitted.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Target Units</p>
                    <p className="text-xl font-mono font-semibold" data-testid="stat-target-units">
                      {campaign.targetUnits?.toLocaleString() || Math.floor(parseFloat(campaign.targetAmount) / parseFloat(campaign.unitPrice)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Deadline</p>
                    <p className="text-sm font-medium">
                      {format(new Date(campaign.aggregationDeadline), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/campaigns/${campaignId}/fulfillment`}>
                    <Button data-testid="button-fulfillment-console">
                      <Truck className="w-4 h-4 mr-2" />
                      Open Fulfillment Console
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Admin Actions</CardTitle>
                  <CardDescription>
                    State-guarded actions based on campaign lifecycle
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const actions = getAvailableActions(campaign);
                  if (actions.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No actions available for current campaign state.
                      </p>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action.actionCode}
                          variant={action.actionCode === "FAIL_CAMPAIGN" ? "destructive" : "default"}
                          onClick={() => handleAdminAction(action)}
                          data-testid={`button-action-${action.actionCode.toLowerCase()}`}
                        >
                          {action.actionCode === "MARK_FUNDED" && <CheckCircle className="w-4 h-4 mr-2" />}
                          {action.actionCode === "FAIL_CAMPAIGN" && <XCircle className="w-4 h-4 mr-2" />}
                          {action.actionCode === "PUBLISH" && <Send className="w-4 h-4 mr-2" />}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Supplier Interaction</CardTitle>
                  <CardDescription>
                    {!isPublished ? "Configure supplier settings" : "Track supplier quotes and acceptance status"}
                  </CardDescription>
                </div>
                {!isPublished && editingSection !== "supplier" && (
                  <Button onClick={() => {
                    setEditingSection("supplier");
                    setEditForm({
                      supplierDirectConfirmed: campaign.supplierDirectConfirmed || false,
                      rules: campaign.rules || "",
                    });
                  }} data-testid="button-edit-supplier">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Supplier
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editingSection === "supplier" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="edit-supplier-confirmed"
                        checked={editForm.supplierDirectConfirmed || false}
                        onChange={(e) => setEditForm({...editForm, supplierDirectConfirmed: e.target.checked})}
                        className="w-4 h-4"
                        data-testid="checkbox-supplier-confirmed"
                      />
                      <Label htmlFor="edit-supplier-confirmed">Supplier has confirmed direct delivery capability</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-rules">Campaign Rules</Label>
                      <Textarea
                        id="edit-rules"
                        value={editForm.rules || ""}
                        onChange={(e) => setEditForm({...editForm, rules: e.target.value})}
                        rows={3}
                        placeholder="Describe participation rules, refund policies, etc."
                        data-testid="input-edit-rules"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => saveMutation.mutate({
                          supplierDirectConfirmed: editForm.supplierDirectConfirmed,
                          rules: editForm.rules,
                        })}
                        disabled={saveMutation.isPending}
                        data-testid="button-save-supplier"
                      >
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingSection(null); setEditForm({}); }} data-testid="button-cancel-supplier">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Supplier Accepted</p>
                      <p className="font-medium" data-testid="text-supplier-accepted">
                        {campaign.supplierAcceptedAt ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not yet</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Direct Delivery Confirmed</p>
                      <p className="font-medium" data-testid="text-supplier-direct">
                        {campaign.supplierDirectConfirmed ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </p>
                    </div>
                    {campaign.supplierAcceptedAt && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Accepted At</p>
                        <p className="font-medium">
                          {format(new Date(campaign.supplierAcceptedAt), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    )}
                    {campaign.rules && campaign.rules !== "Standard campaign rules apply." && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs mb-1">Campaign Rules</p>
                        <p className="text-sm">{campaign.rules}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Product Details</CardTitle>
                  <CardDescription>
                    {!isPublished ? "Product information for transparency and fulfillment" : "Core product fields locked after publishing"}
                  </CardDescription>
                </div>
                {!isPublished && editingSection !== "product" && (
                  <Button onClick={() => {
                    setEditingSection("product");
                    setEditForm({
                      brand: campaign.brand || "",
                      modelNumber: campaign.modelNumber || "",
                      variant: campaign.variant || "",
                      shortDescription: campaign.shortDescription || "",
                      primaryImageUrl: campaign.primaryImageUrl || "",
                    });
                  }} data-testid="button-edit-product">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {editingSection === "product" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-brand">Brand</Label>
                        <Input
                          id="edit-brand"
                          value={editForm.brand || ""}
                          onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                          data-testid="input-edit-brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-model">Model / MPN</Label>
                        <Input
                          id="edit-model"
                          value={editForm.modelNumber || ""}
                          onChange={(e) => setEditForm({...editForm, modelNumber: e.target.value})}
                          data-testid="input-edit-model"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-variant">Variant</Label>
                      <Input
                        id="edit-variant"
                        value={editForm.variant || ""}
                        onChange={(e) => setEditForm({...editForm, variant: e.target.value})}
                        data-testid="input-edit-variant"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Image</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="edit-primary-image"
                          value={editForm.primaryImageUrl || ""}
                          onChange={(e) => setEditForm({...editForm, primaryImageUrl: e.target.value})}
                          placeholder="Enter URL or upload an image"
                          className="flex-1"
                          data-testid="input-edit-primary-image"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const urlRes = await fetch("/api/uploads/request-url", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    name: file.name,
                                    size: file.size,
                                    contentType: file.type,
                                  }),
                                });
                                const { uploadURL, objectPath } = await urlRes.json();
                                await fetch(uploadURL, {
                                  method: "PUT",
                                  body: file,
                                  headers: { "Content-Type": file.type },
                                });
                                // Use the objectPath which resolves to /objects/... endpoint
                                setEditForm({...editForm, primaryImageUrl: objectPath});
                                toast({ title: "Image Uploaded", description: "Image uploaded successfully." });
                              } catch (err) {
                                toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
                              }
                            }}
                            data-testid="input-upload-primary-image"
                          />
                          <Button type="button" variant="outline" asChild>
                            <span><Upload className="w-4 h-4 mr-2" />Upload</span>
                          </Button>
                        </label>
                      </div>
                      {editForm.primaryImageUrl && (
                        <div className="mt-2">
                          <img 
                            src={editForm.primaryImageUrl} 
                            alt="Preview" 
                            className="w-24 h-24 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-short-description">Short Description</Label>
                      <Textarea
                        id="edit-short-description"
                        value={editForm.shortDescription || ""}
                        onChange={(e) => setEditForm({...editForm, shortDescription: e.target.value})}
                        rows={2}
                        data-testid="input-edit-short-description"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => saveMutation.mutate({
                          brand: editForm.brand,
                          modelNumber: editForm.modelNumber,
                          variant: editForm.variant,
                          shortDescription: editForm.shortDescription,
                          primaryImageUrl: editForm.primaryImageUrl,
                        })}
                        disabled={saveMutation.isPending}
                        data-testid="button-save-product"
                      >
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingSection(null); setEditForm({}); }} data-testid="button-cancel-product">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Brand</p>
                      <p className="font-medium" data-testid="text-brand">{campaign.brand || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Model / MPN</p>
                      <p className="font-medium" data-testid="text-model">{campaign.modelNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Variant</p>
                      <p className="font-medium" data-testid="text-variant">{campaign.variant || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">SKU</p>
                      <p className="font-mono text-sm" data-testid="text-sku">{campaign.sku || "—"}</p>
                    </div>
                  </div>
                )}

                {campaign.shortDescription && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Short Description</p>
                    <p className="text-sm" data-testid="text-short-description">{campaign.shortDescription}</p>
                  </div>
                )}

                {campaign.specs && (() => {
                  try {
                    const specs: SpecEntry[] = JSON.parse(campaign.specs);
                    if (specs.length > 0) {
                      return (
                        <div>
                          <p className="text-muted-foreground text-xs mb-2">Specifications</p>
                          <div className="space-y-1 text-sm">
                            {specs.map((spec, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-muted-foreground min-w-[120px]">{spec.key}:</span>
                                <span>{spec.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch {
                    return null;
                  }
                })()}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-2">Primary Image</p>
                    {campaign.primaryImageUrl ? (
                      <div className="space-y-1">
                        <img 
                          src={campaign.primaryImageUrl} 
                          alt="Primary product" 
                          className="w-24 h-24 object-cover rounded border"
                          data-testid="img-primary"
                        />
                        <a 
                          href={campaign.primaryImageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View full size
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No image</p>
                    )}
                  </div>
                  {campaign.galleryImageUrls && (() => {
                    try {
                      const gallery: string[] = JSON.parse(campaign.galleryImageUrls);
                      if (gallery.length > 0) {
                        return (
                          <div>
                            <p className="text-muted-foreground text-xs mb-2">Gallery</p>
                            <div className="flex flex-wrap gap-2">
                              {gallery.map((url, i) => (
                                <img 
                                  key={i}
                                  src={url} 
                                  alt={`Gallery ${i + 1}`} 
                                  className="w-16 h-16 object-cover rounded border"
                                  data-testid={`img-gallery-${i}`}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>

                {campaign.referencePrices && (() => {
                  try {
                    const prices: ReferencePriceEntry[] = JSON.parse(campaign.referencePrices);
                    if (prices.length > 0) {
                      return (
                        <div>
                          <p className="text-muted-foreground text-xs mb-2">Reference Price (Transparency Only)</p>
                          <div className="space-y-2 text-sm">
                            {prices.map((price, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                                <span className="font-mono font-medium">
                                  {price.currency || "USD"} {price.amount.toLocaleString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {price.source === "MSRP" && "Manufacturer MSRP"}
                                  {price.source === "RETAILER_LISTING" && "Retailer listing"}
                                  {price.source === "SUPPLIER_QUOTE" && "Supplier quote"}
                                  {price.source === "OTHER" && "Other"}
                                </Badge>
                                {price.url && (
                                  <a 
                                    href={price.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Source
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch {
                    return null;
                  }
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Delivery Settings</CardTitle>
                  <CardDescription>
                    {campaign.deliveryStrategy === "BULK_TO_CONSOLIDATION"
                      ? "Bulk delivery to consolidation point"
                      : "Supplier direct fulfillment to participants"}
                    {isFulfillmentPhase && " (locked)"}
                  </CardDescription>
                </div>
                {!isPublished && !isFulfillmentPhase && editingSection !== "delivery" && (
                  <Button onClick={() => {
                    setEditingSection("delivery");
                    setEditForm({
                      deliveryStrategy: campaign.deliveryStrategy || "SUPPLIER_DIRECT",
                      deliveryWindow: campaign.deliveryWindow || "",
                      fulfillmentNotes: campaign.fulfillmentNotes || "",
                      consolidationContactName: campaign.consolidationContactName || "",
                      consolidationCompany: campaign.consolidationCompany || "",
                      consolidationContactEmail: campaign.consolidationContactEmail || "",
                      consolidationAddressLine1: campaign.consolidationAddressLine1 || "",
                      consolidationCity: campaign.consolidationCity || "",
                      consolidationState: campaign.consolidationState || "",
                      consolidationPostalCode: campaign.consolidationPostalCode || "",
                      consolidationPhone: campaign.consolidationPhone || "",
                    });
                  }} data-testid="button-edit-delivery">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Delivery
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editingSection === "delivery" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-delivery-strategy">Delivery Strategy</Label>
                      <select
                        id="edit-delivery-strategy"
                        value={editForm.deliveryStrategy || "SUPPLIER_DIRECT"}
                        onChange={(e) => setEditForm({...editForm, deliveryStrategy: e.target.value})}
                        className="w-full p-2 border rounded"
                        data-testid="select-delivery-strategy"
                      >
                        <option value="SUPPLIER_DIRECT">Supplier Direct</option>
                        <option value="BULK_TO_CONSOLIDATION">Bulk to Consolidation</option>
                      </select>
                    </div>
                    {editForm.deliveryStrategy === "BULK_TO_CONSOLIDATION" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-company">Company / Organization</Label>
                            <Input
                              id="edit-consolidation-company"
                              value={editForm.consolidationCompany || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationCompany: e.target.value})}
                              data-testid="input-edit-consolidation-company"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-contact">Contact Name</Label>
                            <Input
                              id="edit-consolidation-contact"
                              value={editForm.consolidationContactName || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationContactName: e.target.value})}
                              data-testid="input-edit-consolidation-contact"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-email">Contact Email</Label>
                            <Input
                              id="edit-consolidation-email"
                              type="email"
                              value={editForm.consolidationContactEmail || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationContactEmail: e.target.value})}
                              data-testid="input-edit-consolidation-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-phone">Contact Phone</Label>
                            <Input
                              id="edit-consolidation-phone"
                              value={editForm.consolidationPhone || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationPhone: e.target.value})}
                              data-testid="input-edit-consolidation-phone"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-consolidation-address">Address Line 1</Label>
                          <Input
                            id="edit-consolidation-address"
                            value={editForm.consolidationAddressLine1 || ""}
                            onChange={(e) => setEditForm({...editForm, consolidationAddressLine1: e.target.value})}
                            data-testid="input-edit-consolidation-address"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-city">City</Label>
                            <Input
                              id="edit-consolidation-city"
                              value={editForm.consolidationCity || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationCity: e.target.value})}
                              data-testid="input-edit-consolidation-city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-state">State</Label>
                            <Input
                              id="edit-consolidation-state"
                              value={editForm.consolidationState || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationState: e.target.value})}
                              data-testid="input-edit-consolidation-state"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-consolidation-postal">Postal Code</Label>
                            <Input
                              id="edit-consolidation-postal"
                              value={editForm.consolidationPostalCode || ""}
                              onChange={(e) => setEditForm({...editForm, consolidationPostalCode: e.target.value})}
                              data-testid="input-edit-consolidation-postal"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-delivery-window">Delivery Window</Label>
                        <Input
                          id="edit-delivery-window"
                          value={editForm.deliveryWindow || ""}
                          onChange={(e) => setEditForm({...editForm, deliveryWindow: e.target.value})}
                          placeholder="e.g., 2-3 weeks"
                          data-testid="input-edit-delivery-window"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-fulfillment-notes">Fulfillment Notes</Label>
                      <Textarea
                        id="edit-fulfillment-notes"
                        value={editForm.fulfillmentNotes || ""}
                        onChange={(e) => setEditForm({...editForm, fulfillmentNotes: e.target.value})}
                        rows={2}
                        data-testid="input-edit-fulfillment-notes"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => saveMutation.mutate({
                          deliveryStrategy: editForm.deliveryStrategy,
                          deliveryWindow: editForm.deliveryWindow,
                          fulfillmentNotes: editForm.fulfillmentNotes,
                          consolidationContactName: editForm.consolidationContactName,
                          consolidationCompany: editForm.consolidationCompany,
                          consolidationContactEmail: editForm.consolidationContactEmail,
                          consolidationAddressLine1: editForm.consolidationAddressLine1,
                          consolidationCity: editForm.consolidationCity,
                          consolidationState: editForm.consolidationState,
                          consolidationPostalCode: editForm.consolidationPostalCode,
                          consolidationPhone: editForm.consolidationPhone,
                        })}
                        disabled={saveMutation.isPending}
                        data-testid="button-save-delivery"
                      >
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingSection(null); setEditForm({}); }} data-testid="button-cancel-delivery">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : campaign.deliveryStrategy === "SUPPLIER_DIRECT" ? (
                  <div className="p-4 bg-muted/30 rounded text-sm">
                    <p>Supplier is responsible for direct fulfillment to participants.</p>
                    {campaign.supplierDirectConfirmed && (
                      <p className="mt-2 text-green-600 dark:text-green-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Supplier has confirmed direct delivery capability
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Company / Organization</p>
                      <p className="font-medium" data-testid="text-consolidation-company">{campaign.consolidationCompany || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Contact Name</p>
                      <p className="font-medium" data-testid="text-consolidation-contact">{campaign.consolidationContactName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Contact Email</p>
                      <p className="font-medium" data-testid="text-consolidation-email">{campaign.consolidationContactEmail || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Contact Phone</p>
                      <p className="font-medium" data-testid="text-consolidation-phone">{campaign.consolidationPhone || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Address</p>
                      <p className="font-medium">
                        {campaign.consolidationAddressLine1 || "—"}
                        {campaign.consolidationAddressLine2 && `, ${campaign.consolidationAddressLine2}`}
                      </p>
                      {(campaign.consolidationCity || campaign.consolidationState || campaign.consolidationPostalCode) && (
                        <p className="text-muted-foreground">
                          {[campaign.consolidationCity, campaign.consolidationState, campaign.consolidationPostalCode]
                            .filter(Boolean)
                            .join(", ")}
                          {campaign.consolidationCountry && ` ${campaign.consolidationCountry}`}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Delivery Window</p>
                      <p className="font-medium">{campaign.deliveryWindow || "—"}</p>
                    </div>
                    {campaign.fulfillmentNotes && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Fulfillment Notes</p>
                        <p className="text-sm">{campaign.fulfillmentNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Buyer Commitments
                </CardTitle>
                <CardDescription>
                  Read-only list of all commitments for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!commitments || commitments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No commitments yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Participant</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Email</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">Units</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commitments.map((c) => (
                          <tr key={c.id} className="border-b last:border-0" data-testid={`row-commitment-${c.id}`}>
                            <td className="py-2 px-2">{c.participantName}</td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {c.participantEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">{c.quantity}</td>
                            <td className="py-2 px-2 text-right font-mono">${parseFloat(c.amount).toLocaleString()}</td>
                            <td className="py-2 px-2">
                              <Badge variant={c.status === "LOCKED" ? "secondary" : c.status === "REFUNDED" ? "destructive" : "default"}>
                                {c.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {format(new Date(c.createdAt), "MMM d, yyyy")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Timeline</CardTitle>
                <CardDescription>Append-only audit log of campaign events</CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline
                  events={timelineEvents}
                  emptyStateTitle="No events yet"
                  emptyStateHint="Campaign events will appear here as the campaign progresses"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground" data-testid="text-not-found">
                Campaign not found.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Publishing makes this campaign visible and joinable by participants.
              After publishing, core campaign fields will be locked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              data-testid="button-confirm-publish"
            >
              {publishMutation.isPending ? "Publishing..." : "Publish Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Hiding will make this campaign invisible to participants.
              Existing commitments will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => hideMutation.mutate()}
              disabled={hideMutation.isPending}
              data-testid="button-confirm-hide"
            >
              {hideMutation.isPending ? "Hiding..." : "Hide Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.actionCode === "FAIL_CAMPAIGN" ? "Fail Campaign" : "Confirm Action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.actionCode === "MARK_FUNDED" && 
                "This will transition the campaign to FUNDED state. Supplier confirmation will be required before fulfillment can begin."}
              {pendingAction?.actionCode === "START_FULFILLMENT" && 
                "This will start the fulfillment phase. Campaign fields will be locked and delivery can begin."}
              {pendingAction?.actionCode === "RELEASE_ESCROW" && 
                "This will release all locked funds to the supplier. This action cannot be undone."}
              {pendingAction?.actionCode === "FAIL_CAMPAIGN" && 
                "This will mark the campaign as failed. All locked funds will be available for refund."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && adminActionMutation.mutate(pendingAction.actionCode)}
              disabled={adminActionMutation.isPending}
              className={pendingAction?.actionCode === "FAIL_CAMPAIGN" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              data-testid="button-confirm-action"
            >
              {adminActionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                pendingAction?.label || "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
