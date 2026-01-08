import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Wallet } from "lucide-react";
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

function mapCommitmentsToEscrowEvents(commitments: Commitment[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  commitments.forEach((commitment) => {
    events.push({
      id: `lock-${commitment.id}`,
      title: "LOCK",
      timestamp: commitment.createdAt,
      subtitle: commitment.campaign.title,
      status: "neutral",
      monospaceFields: [
        { label: "Reference", value: commitment.referenceNumber },
        { label: "Amount", value: `$${parseFloat(commitment.amount).toFixed(2)}` },
      ],
      tags: ["Escrow entry"],
      isImmutable: true,
    });

    if (commitment.campaign.state === "FAILED") {
      events.push({
        id: `refund-${commitment.id}`,
        title: "REFUND",
        timestamp: new Date().toISOString(),
        subtitle: `Campaign failed - ${commitment.campaign.title}`,
        status: "warning",
        monospaceFields: [
          { label: "Reference", value: commitment.referenceNumber },
          { label: "Amount", value: `$${parseFloat(commitment.amount).toFixed(2)}` },
        ],
        tags: ["Escrow entry"],
        isImmutable: true,
      });
    }

    if (commitment.campaign.state === "RELEASED") {
      events.push({
        id: `release-${commitment.id}`,
        title: "RELEASE",
        timestamp: new Date().toISOString(),
        subtitle: `Funds released - ${commitment.campaign.title}`,
        status: "success",
        monospaceFields: [
          { label: "Reference", value: commitment.referenceNumber },
          { label: "Amount", value: `$${parseFloat(commitment.amount).toFixed(2)}` },
        ],
        tags: ["Escrow entry"],
        isImmutable: true,
      });
    }
  });

  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export default function PaymentsPage() {
  const { isAuthenticated } = useAuth();

  const { data: commitments, isLoading } = useQuery<Commitment[]>({
    queryKey: ["/api/account/commitments"],
    enabled: isAuthenticated,
  });

  const escrowEvents = commitments ? mapCommitmentsToEscrowEvents(commitments) : [];

  const totalLocked = commitments?.reduce((sum, c) => {
    if (["AGGREGATION", "SUCCESS", "FULFILLMENT"].includes(c.campaign.state)) {
      return sum + parseFloat(c.amount);
    }
    return sum;
  }, 0) || 0;

  const totalRefunded = commitments?.reduce((sum, c) => {
    if (c.campaign.state === "FAILED") {
      return sum + parseFloat(c.amount);
    }
    return sum;
  }, 0) || 0;

  const totalReleased = commitments?.reduce((sum, c) => {
    if (c.campaign.state === "RELEASED") {
      return sum + parseFloat(c.amount);
    }
    return sum;
  }, 0) || 0;

  return (
    <AccountLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Payments & Escrow</CardTitle>
            </div>
            <CardDescription>
              Your escrow balance and fund movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-md border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Currently locked</p>
                  <p className="text-xl font-mono font-semibold" data-testid="text-locked-amount">
                    ${totalLocked.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-md border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Refunded</p>
                  <p className="text-xl font-mono font-semibold" data-testid="text-refunded-amount">
                    ${totalRefunded.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-md border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Released</p>
                  <p className="text-xl font-mono font-semibold" data-testid="text-released-amount">
                    ${totalReleased.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Escrow Ledger</CardTitle>
            <CardDescription>
              Append-only record of all fund movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <Timeline
                events={escrowEvents}
                density="comfortable"
                showConnector={true}
                emptyStateTitle="No escrow entries"
                emptyStateHint="Your fund movements will appear here when you make commitments"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
