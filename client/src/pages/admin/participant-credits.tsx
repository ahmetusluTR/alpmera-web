import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

type CreditEventType = "ISSUED" | "RESERVED" | "RELEASED" | "APPLIED" | "REVOKED" | "EXPIRED";

interface CreditLedgerEntry {
  id: string;
  participantId: string;
  participantEmail?: string;
  eventType: CreditEventType;
  amount: string;
  currency: string;
  campaignId: string | null;
  campaignName?: string;
  commitmentId: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

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

interface CreditLedgerResponse {
  entries: CreditLedgerEntry[];
  total: number;
  limit: number;
  offset: number;
}

export default function ParticipantCreditsPage() {
  const [, params] = useRoute("/admin/participants/:id/credits");
  const participantId = params?.id;

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery<CreditSummary>({
    queryKey: ["/api/admin/credits/participant", participantId, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/credits/participant/${participantId}/summary`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Participant not found");
        throw new Error(await res.text());
      }
      return res.json();
    },
    enabled: !!participantId,
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery<CreditLedgerResponse>({
    queryKey: ["/api/admin/credits", participantId],
    queryFn: async () => {
      const params = new URLSearchParams({
        participantId: participantId!,
        limit: "50",
        offset: "0",
      });
      const res = await fetch(`/api/admin/credits?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!participantId,
  });

  const isLoading = summaryLoading || ledgerLoading;
  const hasError = summaryError;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/credits">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Participant Credits</h1>
            {summary && (
              <p className="text-muted-foreground mt-1">
                {summary.participantEmail} • User ID: {summary.participantId}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading participant credit summary...
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {hasError && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-destructive mb-4">
                  ⚠️ Error loading credit summary
                </p>
                <p className="text-muted-foreground mb-4">
                  {hasError instanceof Error ? hasError.message : "Could not retrieve credit information for this participant."}
                </p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && !hasError && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <CardDescription>Sum of all credit events</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${summary.totalBalance} {summary.currency}</p>
                </CardContent>
              </Card>

              {/* Lifetime Earned */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Lifetime Earned</CardTitle>
                  <CardDescription>All credits issued</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${summary.breakdown.lifetimeEarned} {summary.currency}</p>
                </CardContent>
              </Card>

              {/* Currently Reserved */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Currently Reserved</CardTitle>
                  <CardDescription>Held for pending commitments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${summary.breakdown.currentlyReserved} {summary.currency}</p>
                  {parseFloat(summary.breakdown.currentlyReserved) > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ Reserved credits cannot be used for new commitments
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Available Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                  <CardDescription>Usable for new commitments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">${summary.breakdown.availableBalance} {summary.currency}</p>
                </CardContent>
              </Card>
            </div>

            {/* Credit Ledger History */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Ledger History</CardTitle>
                <CardDescription>
                  Append-only record of all credit events for this participant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ledgerLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading ledger entries...
                  </div>
                )}

                {ledger && ledger.entries.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium mb-2">No credit history</p>
                    <p className="text-muted-foreground">
                      This participant has not yet received or used any credits.
                    </p>
                  </div>
                )}

                {ledger && ledger.entries.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Created At</th>
                          <th className="text-left py-3 px-4 font-medium">Event Type</th>
                          <th className="text-right py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Campaign</th>
                          <th className="text-left py-3 px-4 font-medium">Reason</th>
                          <th className="text-left py-3 px-4 font-medium">Created By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.entries.map((entry) => (
                          <tr key={entry.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                entry.eventType === "ISSUED" ? "bg-green-100 text-green-800" :
                                entry.eventType === "RESERVED" ? "bg-yellow-100 text-yellow-800" :
                                entry.eventType === "RELEASED" ? "bg-blue-100 text-blue-800" :
                                entry.eventType === "APPLIED" ? "bg-purple-100 text-purple-800" :
                                entry.eventType === "REVOKED" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {entry.eventType}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-mono">
                              <span className={parseFloat(entry.amount) >= 0 ? "text-green-600" : "text-red-600"}>
                                {parseFloat(entry.amount) >= 0 ? "+" : ""}
                                {parseFloat(entry.amount).toFixed(2)} {entry.currency}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {entry.campaignId ? (
                                <Link href={`/admin/campaigns/${entry.campaignId}`}>
                                  <a className="text-primary hover:underline">
                                    {entry.campaignName || entry.campaignId.slice(0, 8)}
                                  </a>
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm max-w-xs truncate" title={entry.reason}>
                              {entry.reason}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {entry.createdBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
