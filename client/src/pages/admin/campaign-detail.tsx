import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Timeline, TimelineEvent } from "@/components/timeline";
import { ArrowLeft, RefreshCw, Truck, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  state: string;
  aggregationDeadline: string;
  targetAmount: string;
  unitPrice: string;
  participantCount: number;
  totalCommitted: number;
  createdAt: string;
  supplierAcceptedAt: string | null;
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

  const { data: campaign, isLoading, error, refetch } = useQuery<CampaignDetail>({
    queryKey: [`/api/admin/campaigns/${campaignId}/detail`],
    enabled: !!campaignId,
  });

  const { data: timeline } = useQuery<TimelineEntry[]>({
    queryKey: ["/api/admin/logs"],
    enabled: !!campaignId,
    select: (logs) => logs.filter((log: any) => log.campaignId === campaignId),
  });

  const timelineEvents = timeline ? mapToTimelineEvents(timeline) : [];

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
          {campaign && (
            <Badge className={STATE_COLORS[campaign.state] || "bg-muted"} data-testid="badge-campaign-state">
              {campaign.state}
            </Badge>
          )}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Participants</p>
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
    </AdminLayout>
  );
}
