import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { AccountLayout } from "./layout";
import { Timeline, TimelineEvent } from "@/components/timeline";

interface Commitment {
  id: string;
  referenceNumber: string;
  userId: string | null;
  quantity: number;
  amount: string;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    state: string;
  };
}

function getCommitmentStatus(campaignState: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (campaignState) {
    case "AGGREGATION":
    case "SUCCESS":
    case "FULFILLMENT":
      return { label: "LOCKED", variant: "default" };
    case "FAILED":
      return { label: "REFUNDED", variant: "secondary" };
    case "RELEASED":
      return { label: "RELEASED", variant: "outline" };
    default:
      return { label: campaignState, variant: "secondary" };
  }
}

function mapCommitmentToTimelineEvents(commitment: Commitment): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  events.push({
    id: `${commitment.id}-created`,
    title: "Commitment created",
    timestamp: commitment.createdAt,
    subtitle: `Funds locked in escrow`,
    status: "success",
    monospaceFields: [
      { label: "Reference", value: commitment.referenceNumber },
      { label: "Amount", value: `$${parseFloat(commitment.amount).toFixed(2)}` },
    ],
    isImmutable: true,
  });

  if (commitment.campaign.state === "SUCCESS") {
    events.push({
      id: `${commitment.id}-success`,
      title: "Campaign reached target",
      timestamp: new Date().toISOString(),
      subtitle: "Awaiting supplier acceptance",
      status: "info",
    });
  }

  if (commitment.campaign.state === "FULFILLMENT") {
    events.push({
      id: `${commitment.id}-fulfillment`,
      title: "Fulfillment in progress",
      timestamp: new Date().toISOString(),
      subtitle: "Supplier is fulfilling commitments",
      status: "info",
    });
  }

  if (commitment.campaign.state === "FAILED") {
    events.push({
      id: `${commitment.id}-failed`,
      title: "Campaign failed",
      timestamp: new Date().toISOString(),
      subtitle: "Funds refunded to participants",
      status: "warning",
      isImmutable: true,
    });
  }

  if (commitment.campaign.state === "RELEASED") {
    events.push({
      id: `${commitment.id}-released`,
      title: "Funds released",
      timestamp: new Date().toISOString(),
      subtitle: "Campaign completed successfully",
      status: "success",
      isImmutable: true,
    });
  }

  return events;
}

export default function CommitmentsPage() {
  const { isAuthenticated } = useAuth();

  const { data: commitments, isLoading } = useQuery<Commitment[]>({
    queryKey: ["/api/account/commitments"],
    enabled: isAuthenticated,
  });

  return (
    <AccountLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">My Commitments</CardTitle>
          </div>
          <CardDescription>
            Your campaign commitments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : commitments && commitments.length > 0 ? (
            <div className="space-y-6">
              {commitments.map((commitment) => {
                const status = getCommitmentStatus(commitment.campaign.state);
                const events = mapCommitmentToTimelineEvents(commitment);
                return (
                  <div
                    key={commitment.id}
                    className="p-4 rounded-md border border-border"
                    data-testid={`commitment-item-${commitment.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <Link href={`/campaign/${commitment.campaign.id}`}>
                          <span className="font-medium text-sm hover:underline cursor-pointer">
                            {commitment.campaign.title}
                          </span>
                        </Link>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="font-mono" data-testid={`text-reference-${commitment.id}`}>
                            {commitment.referenceNumber}
                          </span>
                          <span>Qty: {commitment.quantity}</span>
                          <span>{format(new Date(commitment.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <Badge variant={status.variant} className="shrink-0">
                        {status.label}
                      </Badge>
                    </div>
                    <Timeline
                      events={events}
                      density="compact"
                      showConnector={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No commitments yet
            </p>
          )}
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
