import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { AccountLayout } from "./layout";
import { Timeline, TimelineEvent } from "@/components/timeline";

interface Commitment {
  id: string;
  referenceNumber: string;
  quantity: number;
  amount: string;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    state: string;
  };
}

function mapRefundsToTimelineEvents(commitments: Commitment[]): TimelineEvent[] {
  return commitments
    .filter(c => c.campaign.state === "FAILED")
    .map((commitment) => ({
      id: `refund-${commitment.id}`,
      title: "Refund processed",
      timestamp: new Date().toISOString(),
      subtitle: commitment.campaign.title,
      status: "success" as const,
      monospaceFields: [
        { label: "Reference", value: commitment.referenceNumber },
        { label: "Amount", value: `$${parseFloat(commitment.amount).toFixed(2)}` },
      ],
      meta: [
        { label: "Original commitment", value: format(new Date(commitment.createdAt), "MMM d, yyyy") },
      ],
      details: "Funds returned due to campaign failure",
      isImmutable: true,
    }));
}

export default function RefundsPage() {
  const { isAuthenticated } = useAuth();

  const { data: commitments, isLoading } = useQuery<Commitment[]>({
    queryKey: ["/api/account/commitments"],
    enabled: isAuthenticated,
  });

  const refundedCommitments = commitments?.filter(c => c.campaign.state === "FAILED") || [];
  const refundEvents = commitments ? mapRefundsToTimelineEvents(commitments) : [];

  const totalRefunded = refundedCommitments.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  return (
    <AccountLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Refunds</CardTitle>
            </div>
            <CardDescription>
              Refunds from failed campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="p-4 rounded-md border border-border mb-6">
                <p className="text-xs text-muted-foreground mb-1">Total refunded</p>
                <p className="text-xl font-mono font-semibold" data-testid="text-total-refunded">
                  ${totalRefunded.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {refundedCommitments.length} refund{refundedCommitments.length !== 1 ? "s" : ""} processed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Refund History</CardTitle>
            <CardDescription>
              Append-only record of refund transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : refundedCommitments.length > 0 ? (
              <div className="space-y-4">
                {refundedCommitments.map((commitment) => (
                  <div
                    key={commitment.id}
                    className="p-4 rounded-md border border-border"
                    data-testid={`refund-item-${commitment.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-medium text-sm">
                          {commitment.campaign.title}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="font-mono">
                            {commitment.referenceNumber}
                          </span>
                          <span>{format(new Date(commitment.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        REFUNDED
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount refunded</span>
                      <span className="font-mono font-medium">
                        ${parseFloat(commitment.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Timeline
                events={refundEvents}
                emptyStateTitle="No refunds"
                emptyStateHint="Refunds will appear here if a campaign you committed to fails"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
