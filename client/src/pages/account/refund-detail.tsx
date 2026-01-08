import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AccountLayout } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, RotateCcw, ExternalLink, Lock, Unlock, FileText, Package } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { Timeline, TimelineEvent } from "@/components/timeline";

interface LifecycleEntry {
  id: string;
  entryType: "LOCK" | "REFUND" | "RELEASE";
  amount: string;
  createdAt: string;
  reason: string;
  actor: string;
}

interface RefundDetail {
  id: string;
  entryType: "REFUND";
  amount: string;
  createdAt: string;
  reason: string;
  actor: string;
  commitmentCode: string;
  commitmentId: string;
  campaignId: string;
  campaignName: string;
  campaignState: string;
  lifecycleEntries: LifecycleEntry[];
}

function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    commitment_created: "Commitment created",
    campaign_failed_refund: "Campaign failed",
    admin_refund: "Admin refund",
    admin_release: "Campaign fulfilled",
  };
  return reasonMap[reason] || reason;
}

function getEntryIcon(entryType: string) {
  switch (entryType) {
    case "LOCK":
      return Lock;
    case "REFUND":
      return RotateCcw;
    case "RELEASE":
      return Unlock;
    default:
      return FileText;
  }
}

function mapLifecycleToTimelineEvents(entries: LifecycleEntry[]): TimelineEvent[] {
  return entries
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry) => {
      const Icon = getEntryIcon(entry.entryType);
      const typeLabels: Record<string, string> = {
        LOCK: "Escrow locked",
        REFUND: "Refund processed",
        RELEASE: "Funds released",
      };

      return {
        id: entry.id,
        title: typeLabels[entry.entryType] || entry.entryType,
        timestamp: entry.createdAt,
        status: "success" as const,
        meta: [
          { label: "Reason", value: formatReason(entry.reason) },
          { label: "Actor", value: entry.actor },
        ],
        isImmutable: true,
      };
    });
}

export default function RefundDetailPage() {
  const [, params] = useRoute("/account/refunds/:id");
  const refundId = params?.id;
  const { isAuthenticated } = useAuth();

  const { data: refund, isLoading, error, refetch } = useQuery<RefundDetail>({
    queryKey: [`/api/account/refunds/${refundId}`],
    enabled: isAuthenticated && !!refundId,
  });

  const lifecycleEvents = refund ? mapLifecycleToTimelineEvents(refund.lifecycleEntries) : [];

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/account/refunds">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-refund-heading">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
              Refund
            </h2>
            {refund && (
              <p className="text-sm text-muted-foreground font-mono">
                {refund.commitmentCode}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Unable to load refund.</p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : !refund ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground" data-testid="text-not-found">
                Refund not found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg">Refund Snapshot</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Completed
                  </Badge>
                </div>
                <CardDescription>
                  Append-only ledger entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Refund ID</p>
                    <p className="font-mono text-xs" data-testid="text-refund-id">{refund.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Date</p>
                    <p className="font-mono text-xs" data-testid="text-refund-date">
                      {format(new Date(refund.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Reason</p>
                    <p data-testid="text-refund-reason">{formatReason(refund.reason)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Actor</p>
                    <p className="font-mono text-xs" data-testid="text-refund-actor">{refund.actor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Commitment</p>
                    <p className="font-mono text-xs" data-testid="text-commitment-code">{refund.commitmentCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Campaign</p>
                    <p className="text-xs" data-testid="text-campaign-name">{refund.campaignName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">References</CardTitle>
                <CardDescription>
                  Related campaign and commitment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/campaign/${refund.campaignId}`}>
                  <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-campaign">
                    <ExternalLink className="w-4 h-4" />
                    View campaign
                  </Button>
                </Link>
                <Link href={`/account/commitments/${refund.commitmentCode}`}>
                  <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-commitment">
                    <Package className="w-4 h-4" />
                    View commitment
                  </Button>
                </Link>
                <Link href={`/account/escrow/${refund.id}`}>
                  <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-escrow">
                    <FileText className="w-4 h-4" />
                    View escrow movement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Refund Lifecycle</CardTitle>
                <CardDescription>
                  Append-only timeline of escrow events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline
                  events={lifecycleEvents}
                  emptyStateTitle="No lifecycle events"
                  emptyStateHint="Lifecycle events will appear as your commitment progresses"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
