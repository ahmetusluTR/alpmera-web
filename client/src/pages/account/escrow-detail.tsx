import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { AccountLayout } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineEvent } from "@/components/timeline";
import { ArrowLeft, RefreshCw, Lock, Unlock, RotateCcw, FileText, Package } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

interface EscrowEntry {
  id: string;
  entryType: "LOCK" | "REFUND" | "RELEASE";
  amount: string;
  createdAt: string;
  reason: string;
  actor: string;
}

interface EscrowMovementDetail {
  id: string;
  entryType: "LOCK" | "REFUND" | "RELEASE";
  amount: string;
  createdAt: string;
  reason: string;
  actor: string;
  commitmentCode: string;
  commitmentId: string;
  campaignId: string;
  campaignName: string;
  campaignState: string;
  relatedEntries: EscrowEntry[];
}

function getEntryTypeBadge(entryType: EscrowEntry["entryType"]) {
  switch (entryType) {
    case "LOCK":
      return { label: "Escrow Lock", variant: "secondary" as const, icon: Lock };
    case "REFUND":
      return { label: "Refund", variant: "outline" as const, icon: RotateCcw };
    case "RELEASE":
      return { label: "Release", variant: "default" as const, icon: Unlock };
  }
}

function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    commitment_created: "Commitment created",
    campaign_failed_refund: "Campaign failed",
    admin_release: "Campaign fulfilled",
    admin_refund: "Admin refund",
  };
  return reasonMap[reason] || reason;
}

function getEntryTitle(entryType: EscrowEntry["entryType"]): string {
  switch (entryType) {
    case "LOCK":
      return "Escrow LOCK recorded";
    case "REFUND":
      return "Escrow REFUND recorded";
    case "RELEASE":
      return "Escrow RELEASE recorded";
  }
}

function getEntryStatus(entryType: EscrowEntry["entryType"]): "success" | "warning" | "info" | "neutral" {
  switch (entryType) {
    case "LOCK":
      return "info";
    case "REFUND":
      return "warning";
    case "RELEASE":
      return "success";
  }
}

function buildLedgerTimeline(entries: EscrowEntry[], currentEntryId: string): TimelineEvent[] {
  return entries.map(entry => ({
    id: entry.id,
    title: getEntryTitle(entry.entryType),
    timestamp: entry.createdAt,
    subtitle: formatReason(entry.reason),
    status: getEntryStatus(entry.entryType),
    monospaceFields: [
      { label: "Actor", value: entry.actor },
    ],
    tags: entry.id === currentEntryId ? ["Current entry"] : undefined,
    isImmutable: true,
  }));
}

export default function EscrowDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const { data: movement, isLoading, error, refetch } = useQuery<EscrowMovementDetail>({
    queryKey: ["/api/account/escrow", params.id],
    enabled: isAuthenticated && !!params.id,
  });

  const entryBadge = movement ? getEntryTypeBadge(movement.entryType) : null;
  const ledgerTimeline = movement ? buildLedgerTimeline(movement.relatedEntries, movement.id) : [];

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/account/escrow">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-escrow-detail-heading">
              Escrow Movement
            </h2>
            {movement && (
              <p className="text-sm text-muted-foreground font-mono">
                {movement.id.slice(0, 8)}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Unable to load escrow movement.</p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : !movement ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground" data-testid="text-not-found">
                Movement not found.
              </p>
              <Link href="/account/escrow">
                <Button variant="outline" className="mt-4" data-testid="button-back-to-list">
                  Back to escrow ledger
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    {entryBadge && (
                      <Badge variant={entryBadge.variant} className="gap-1">
                        <entryBadge.icon className="w-3 h-3" />
                        {entryBadge.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {format(new Date(movement.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                </div>
                <CardDescription>
                  {formatReason(movement.reason)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Actor</p>
                    <p className="font-mono">{movement.actor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Reason Code</p>
                    <p className="font-mono">{movement.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">References</CardTitle>
                <CardDescription>
                  Related campaign and commitment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{movement.campaignName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{movement.campaignId.slice(0, 8)}</p>
                  </div>
                  <Link href={`/campaign/${movement.campaignId}`}>
                    <Button variant="outline" size="sm" data-testid="button-view-campaign">
                      View campaign
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Commitment</p>
                    <p className="text-xs text-muted-foreground font-mono">{movement.commitmentCode}</p>
                  </div>
                  <Link href={`/account/commitments/${movement.commitmentCode}`}>
                    <Button variant="outline" size="sm" data-testid="button-view-commitment">
                      View commitment
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ledger Timeline</CardTitle>
                <CardDescription>
                  Append-only record for this commitment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ledgerTimeline.length > 0 ? (
                  <Timeline 
                    events={ledgerTimeline} 
                    density="comfortable" 
                    showConnector 
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No ledger entries found.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
