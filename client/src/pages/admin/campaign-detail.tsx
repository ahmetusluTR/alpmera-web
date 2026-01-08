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
import { ArrowLeft, RefreshCw, Truck, Eye, EyeOff, Send, Lock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  state: string;
  adminPublishStatus: string;
  aggregationDeadline: string;
  targetAmount: string;
  unitPrice: string;
  participantCount: number;
  totalCommitted: number;
  createdAt: string;
  supplierAcceptedAt: string | null;
  sku: string | null;
  productName: string | null;
  deliveryStrategy: string;
  consolidationContactName: string | null;
  consolidationCompany: string | null;
  consolidationAddressLine1: string | null;
  consolidationAddressLine2: string | null;
  consolidationCity: string | null;
  consolidationState: string | null;
  consolidationPostalCode: string | null;
  consolidationCountry: string | null;
  consolidationPhone: string | null;
  deliveryWindow: string | null;
  fulfillmentNotes: string | null;
}

interface TimelineEntry {
  id: string;
  action: string;
  newState: string | null;
  reason: string | null;
  actor: string;
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
                  {campaign.state}
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
                    <p className="text-muted-foreground text-xs mb-1">Target</p>
                    <p className="text-xl font-mono font-semibold">
                      ${parseFloat(campaign.targetAmount).toLocaleString()}
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

            {campaign.deliveryStrategy === "BULK_TO_CONSOLIDATION" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consolidation Settings</CardTitle>
                  <CardDescription>
                    Delivery settings for bulk consolidation
                    {isPublished && !isFulfillmentPhase && " (editable)"}
                    {isFulfillmentPhase && " (locked)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Contact Name</p>
                      <p className="font-medium">{campaign.consolidationContactName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Company</p>
                      <p className="font-medium">{campaign.consolidationCompany || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Address</p>
                      <p className="font-medium">
                        {campaign.consolidationAddressLine1 || "-"}
                        {campaign.consolidationAddressLine2 && `, ${campaign.consolidationAddressLine2}`}
                      </p>
                      <p className="text-muted-foreground">
                        {campaign.consolidationCity}, {campaign.consolidationState} {campaign.consolidationPostalCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Phone</p>
                      <p className="font-medium">{campaign.consolidationPhone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Delivery Window</p>
                      <p className="font-medium">{campaign.deliveryWindow || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
    </AdminLayout>
  );
}
