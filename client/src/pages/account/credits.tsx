import { useQuery } from "@tanstack/react-query";
import { AccountLayout } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Coins, TrendingUp, TrendingDown, DollarSign, Lock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

interface CreditSummary {
  participantId: string;
  participantEmail: string | null;
  participantName: string | null;
  currency: string;
  totalBalance: string;
  breakdown: {
    lifetimeEarned: string;
    lifetimeSpent: string;
    currentlyReserved: string;
    availableBalance: string;
  };
  lastUpdated: string | null;
}

interface CreditTransaction {
  id: string;
  eventType: "ISSUED" | "RESERVED" | "RELEASED" | "APPLIED" | "REVOKED" | "EXPIRED";
  amount: string;
  currency: string;
  campaignTitle: string | null;
  campaignId: string | null;
  reason: string | null;
  createdAt: string;
}

interface CreditsResponse {
  summary: CreditSummary;
  transactions: CreditTransaction[];
}

function getEventTypeBadge(eventType: CreditTransaction["eventType"]) {
  switch (eventType) {
    case "ISSUED":
      return { label: "Credited", variant: "default" as const, icon: TrendingUp };
    case "RESERVED":
      return { label: "Reserved", variant: "secondary" as const, icon: Lock };
    case "RELEASED":
      return { label: "Released", variant: "outline" as const, icon: RefreshCw };
    case "APPLIED":
      return { label: "Applied", variant: "outline" as const, icon: TrendingDown };
    case "REVOKED":
      return { label: "Revoked", variant: "destructive" as const, icon: TrendingDown };
    case "EXPIRED":
      return { label: "Expired", variant: "secondary" as const, icon: TrendingDown };
  }
}

function formatReason(reason: string | null): string {
  if (!reason) return "—";

  const reasonMap: Record<string, string> = {
    early_participant_bonus: "Early participant bonus",
    referral_reward: "Referral reward",
    campaign_reward: "Campaign reward",
    commitment_applied: "Applied to commitment",
    commitment_released: "Commitment released",
    admin_issued: "Admin credit",
    admin_revoked: "Admin revoked",
    expired: "Credit expired",
  };

  return reasonMap[reason] || reason;
}

export default function CreditsPage() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<CreditsResponse>({
    queryKey: ["/api/account/credits"],
    enabled: isAuthenticated,
  });

  const summary = data?.summary;
  const transactions = data?.transactions || [];

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Credit Balance Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Credit Balance</CardTitle>
            </div>
            <CardDescription>
              Campaign credits you've earned and can apply to commitments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error || !summary ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load credit balance.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Available Balance - Primary Display */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                      <p className="text-3xl font-bold text-primary">
                        ${parseFloat(summary.breakdown.availableBalance).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-primary/20" />
                  </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Lifetime Earned</p>
                    <p className="text-lg font-semibold text-green-600">
                      +${parseFloat(summary.breakdown.lifetimeEarned).toFixed(2)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Lifetime Spent</p>
                    <p className="text-lg font-semibold text-slate-600">
                      ${parseFloat(summary.breakdown.lifetimeSpent).toFixed(2)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Currently Reserved</p>
                    <p className="text-lg font-semibold text-amber-600">
                      ${parseFloat(summary.breakdown.currentlyReserved).toFixed(2)}
                    </p>
                  </div>
                </div>

                {summary.lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(summary.lastUpdated), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>
              Append-only record of all credit movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load transaction history.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No credit transactions yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Reason</th>
                      <th className="pb-2 font-medium">Campaign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const eventBadge = getEventTypeBadge(transaction.eventType);
                      const Icon = eventBadge.icon;
                      const amountNum = parseFloat(transaction.amount);
                      const isPositive = ["ISSUED", "RELEASED"].includes(transaction.eventType);
                      const isNegative = ["APPLIED", "REVOKED", "EXPIRED"].includes(transaction.eventType);

                      return (
                        <tr
                          key={transaction.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 font-mono text-xs">
                            {format(new Date(transaction.createdAt), "yyyy-MM-dd HH:mm")}
                          </td>
                          <td className="py-3">
                            <Badge variant={eventBadge.variant} className="gap-1">
                              <Icon className="w-3 h-3" />
                              {eventBadge.label}
                            </Badge>
                          </td>
                          <td className="py-3 font-semibold">
                            <span className={
                              isPositive ? "text-green-600" :
                              isNegative ? "text-slate-600" :
                              "text-muted-foreground"
                            }>
                              {isPositive && "+"}
                              {isNegative && "-"}
                              ${Math.abs(amountNum).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {formatReason(transaction.reason)}
                          </td>
                          <td className="py-3">
                            {transaction.campaignTitle ? (
                              <span className="text-sm">{transaction.campaignTitle}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
