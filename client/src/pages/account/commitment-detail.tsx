import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, ExternalLink, RefreshCw, Package, FileText, Truck } from "lucide-react";
import { format } from "date-fns";
import { AccountLayout } from "./layout";
import { Timeline, TimelineEvent } from "@/components/timeline";

interface StatusTransition {
  state: string;
  timestamp: string;
  reason?: string;
}

interface EscrowEntry {
  id: string;
  entryType: string;
  amount: string;
  actor: string;
  reason: string;
  createdAt: string;
}

interface CommitmentDetail {
  id: string;
  referenceNumber: string;
  userId: string | null;
  quantity: number;
  status: string;
  createdAt: string;
  lastCampaignStatusUpdate: string;
  campaign: {
    id: string;
    title: string;
    description: string;
    state: string;
    createdAt: string;
  };
  escrowEntries: EscrowEntry[];
  statusTransitions: StatusTransition[];
}

function getCampaignStatusBadge(state: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (state) {
    case "AGGREGATION":
      return { label: "Aggregating", variant: "default" };
    case "SUCCESS":
      return { label: "Target reached", variant: "default" };
    case "FULFILLMENT":
      return { label: "Fulfilling", variant: "default" };
    case "RELEASED":
      return { label: "Completed", variant: "outline" };
    case "FAILED":
      return { label: "Failed", variant: "secondary" };
    default:
      return { label: state, variant: "secondary" };
  }
}

function getCommitmentStatusBadge(status: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (status) {
    case "LOCKED":
      return { label: "Locked in escrow", variant: "default" };
    case "REFUNDED":
      return { label: "Refunded", variant: "secondary" };
    case "RELEASED":
      return { label: "Released", variant: "outline" };
    default:
      return { label: status, variant: "secondary" };
  }
}

function buildCampaignStatusTimeline(commitment: CommitmentDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: "campaign-created",
    title: "Campaign created",
    timestamp: commitment.campaign.createdAt,
    subtitle: "Campaign started accepting commitments",
    status: "neutral",
    isImmutable: true,
  });

  for (const transition of commitment.statusTransitions) {
    let title = `Campaign status changed`;
    let subtitle = transition.reason || undefined;
    let status: TimelineEvent["status"] = "info";

    switch (transition.state) {
      case "SUCCESS":
        title = "Target reached";
        subtitle = transition.reason || "Campaign reached its funding target";
        status = "success";
        break;
      case "FULFILLMENT":
        title = "Fulfillment started";
        subtitle = transition.reason || "Supplier is fulfilling commitments";
        status = "info";
        break;
      case "RELEASED":
        title = "Campaign completed";
        subtitle = transition.reason || "All funds released to supplier";
        status = "success";
        break;
      case "FAILED":
        title = "Campaign failed";
        subtitle = transition.reason || "Campaign did not reach target or was cancelled";
        status = "danger";
        break;
    }

    events.push({
      id: `transition-${transition.timestamp}`,
      title,
      timestamp: transition.timestamp,
      subtitle,
      status,
      isImmutable: true,
    });
  }

  if (commitment.statusTransitions.length === 0 && commitment.campaign.state !== "AGGREGATION") {
    const stateInfo = getCampaignStatusBadge(commitment.campaign.state);
    events.push({
      id: "current-state",
      title: `Current status: ${stateInfo.label}`,
      timestamp: commitment.campaign.createdAt,
      subtitle: "Status transition details not available",
      status: commitment.campaign.state === "FAILED" ? "danger" : 
              commitment.campaign.state === "RELEASED" ? "success" : "info",
      isImmutable: true,
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function buildUserCommitmentTimeline(commitment: CommitmentDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: "commitment-locked",
    title: "Commitment locked in escrow",
    timestamp: commitment.createdAt,
    subtitle: `Qty: ${commitment.quantity}`,
    status: "success",
    monospaceFields: [
      { label: "Reference", value: commitment.referenceNumber },
    ],
    isImmutable: true,
  });

  for (const entry of commitment.escrowEntries) {
    if (entry.entryType === "REFUND") {
      events.push({
        id: `escrow-${entry.id}`,
        title: "Funds refunded",
        timestamp: entry.createdAt,
        subtitle: entry.reason === "campaign_failed_refund" 
          ? "Campaign did not reach target" 
          : entry.reason,
        status: "warning",
        isImmutable: true,
      });
    } else if (entry.entryType === "RELEASE") {
      events.push({
        id: `escrow-${entry.id}`,
        title: "Funds released to supplier",
        timestamp: entry.createdAt,
        subtitle: "Campaign completed successfully",
        status: "success",
        isImmutable: true,
      });
    }
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function buildDeliveryTimeline(commitment: CommitmentDetail): { events: TimelineEvent[]; showPlaceholder: boolean; inProgress: boolean } {
  const inProgress = commitment.campaign.state === "FULFILLMENT" || commitment.campaign.state === "RELEASED";
  
  if (!inProgress) {
    return { events: [], showPlaceholder: false, inProgress: false };
  }

  const events: TimelineEvent[] = [];
  
  // Find fulfillment transition timestamp from statusTransitions
  const fulfillmentTransition = commitment.statusTransitions.find(t => t.state === "FULFILLMENT");
  const releasedTransition = commitment.statusTransitions.find(t => t.state === "RELEASED");
  
  // Add fulfillment started event
  if (fulfillmentTransition || commitment.campaign.state === "FULFILLMENT" || commitment.campaign.state === "RELEASED") {
    const fulfillmentTime = fulfillmentTransition?.timestamp || commitment.lastCampaignStatusUpdate;
    events.push({
      id: "fulfillment-started",
      title: "Fulfillment initiated",
      timestamp: fulfillmentTime,
      subtitle: "Supplier began processing commitments",
      status: commitment.campaign.state === "RELEASED" ? "success" : "info",
      isImmutable: true,
    });
  }
  
  // Add release event for completed campaigns
  if (commitment.campaign.state === "RELEASED") {
    const releaseTime = releasedTransition?.timestamp || commitment.lastCampaignStatusUpdate;
    
    // Check if there's a RELEASE entry in escrow for this commitment
    const releaseEntry = commitment.escrowEntries.find(e => e.entryType === "RELEASE");
    
    events.push({
      id: "funds-released",
      title: "Campaign completed",
      timestamp: releaseEntry?.createdAt || releaseTime,
      subtitle: "Funds released to supplier",
      status: "success",
      isImmutable: true,
    });
  }

  // Note: Actual delivery tracking (in transit, delivered) would require additional backend data
  // that doesn't exist yet. When delivery tracking is implemented, add those milestones here.
  
  // If in fulfillment but no actual tracking data yet
  if (commitment.campaign.state === "FULFILLMENT" && events.length === 1) {
    events.push({
      id: "awaiting-dispatch",
      title: "Awaiting dispatch",
      timestamp: new Date().toISOString(),
      subtitle: "Delivery updates will appear here when available",
      status: "neutral",
    });
  }

  return { events, showPlaceholder: false, inProgress };
}

export default function CommitmentDetailPage() {
  const params = useParams<{ code: string }>();
  const { isAuthenticated } = useAuth();

  const { data: commitment, isLoading, isError, refetch, isFetching } = useQuery<CommitmentDetail>({
    queryKey: ["/api/account/commitments", params.code],
    enabled: isAuthenticated && !!params.code,
  });

  const campaignStatus = commitment ? getCampaignStatusBadge(commitment.campaign.state) : null;
  const commitmentStatus = commitment ? getCommitmentStatusBadge(commitment.status) : null;

  const campaignTimeline = commitment ? buildCampaignStatusTimeline(commitment) : [];
  const userTimeline = commitment ? buildUserCommitmentTimeline(commitment) : [];
  const deliveryData = commitment ? buildDeliveryTimeline(commitment) : { events: [], showPlaceholder: false, inProgress: false };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/account/commitments">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Back to commitments</span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-sm text-muted-foreground">Unable to load commitment details.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-retry-detail"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : commitment ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{commitment.campaign.title}</CardTitle>
                    <CardDescription className="font-mono mt-1" data-testid="text-commitment-code">
                      {commitment.referenceNumber}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={campaignStatus?.variant}>
                      Campaign: {campaignStatus?.label}
                    </Badge>
                    <Badge variant={commitmentStatus?.variant}>
                      {commitmentStatus?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/campaign/${commitment.campaign.id}`}>
                    <Button variant="outline" size="sm" data-testid="link-view-campaign">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View campaign
                    </Button>
                  </Link>
                  <Link href="/account/payments">
                    <Button variant="outline" size="sm" data-testid="link-view-escrow">
                      <FileText className="w-4 h-4 mr-2" />
                      View escrow movements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Product Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {commitment.campaign.description || "No description available."}
                </p>
                <div className="mt-4 text-sm">
                  <span className="text-muted-foreground">Quantity committed: </span>
                  <span className="font-medium">{commitment.quantity}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Joined: </span>
                  <span className="font-medium">{format(new Date(commitment.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Status Timeline</CardTitle>
                <CardDescription>
                  All campaign state changes (append-only record)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaignTimeline.length > 0 ? (
                  <Timeline events={campaignTimeline} density="comfortable" showConnector />
                ) : (
                  <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Commitment Timeline</CardTitle>
                <CardDescription>
                  Your commitment events (append-only record)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userTimeline.length > 0 ? (
                  <Timeline events={userTimeline} density="comfortable" showConnector />
                ) : (
                  <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Delivery Timeline</CardTitle>
                </div>
                <CardDescription>
                  Fulfillment and delivery milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!deliveryData.inProgress ? (
                  <p className="text-sm text-muted-foreground">
                    Delivery timeline will be available once the campaign enters fulfillment.
                  </p>
                ) : deliveryData.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Delivery updates will appear here once fulfillment begins.
                  </p>
                ) : (
                  <Timeline events={deliveryData.events} density="comfortable" showConnector />
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AccountLayout>
  );
}
