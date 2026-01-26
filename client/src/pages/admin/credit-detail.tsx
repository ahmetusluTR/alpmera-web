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
  participantName?: string;
  eventType: CreditEventType;
  amount: string;
  currency: string;
  campaignId: string | null;
  campaignName?: string;
  commitmentId: string | null;
  ruleSetId: string | null;
  awardId: string | null;
  reservationRef: string | null;
  auditRef: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export default function CreditDetailPage() {
  const [, params] = useRoute("/admin/credits/:id");
  const creditId = params?.id;

  const { data: entry, isLoading, error } = useQuery<CreditLedgerEntry>({
    queryKey: ["/api/admin/credits", creditId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/credits/${creditId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!creditId,
  });

  const { data: balance } = useQuery<{ balance: string; currency: string }>({
    queryKey: ["/api/admin/credits/participant", entry?.participantId, "balance"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/credits/participant/${entry?.participantId}/balance`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!entry?.participantId,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/credits">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Credits
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credit Ledger Entry</h1>
            <p className="text-muted-foreground mt-1">
              {entry ? `Entry ID: ${entry.id}` : "Loading..."}
            </p>
          </div>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading credit ledger entry...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              Error loading entry: {error.message}
            </CardContent>
          </Card>
        )}

        {entry && (
          <>
            {/* Section A: Event Core */}
            <Card>
              <CardHeader>
                <CardTitle>Event Core</CardTitle>
                <CardDescription>Primary event information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event ID</label>
                    <p className="mt-1 font-mono text-sm">{entry.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                    <p className="mt-1">
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
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className={`mt-1 font-mono text-lg font-semibold ${
                      parseFloat(entry.amount) >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {parseFloat(entry.amount) >= 0 ? "+" : ""}
                      {parseFloat(entry.amount).toFixed(2)} {entry.currency}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Currency</label>
                    <p className="mt-1">{entry.currency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="mt-1">{format(new Date(entry.createdAt), "MMM d, yyyy HH:mm:ss")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created By</label>
                    <p className="mt-1">{entry.createdBy}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Reason</label>
                    <p className="mt-1">{entry.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Participant Context */}
            <Card>
              <CardHeader>
                <CardTitle>Participant Context</CardTitle>
                <CardDescription>Participant information and current balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Participant ID</label>
                    <p className="mt-1">
                      <Link href={`/admin/participants/${entry.participantId}`}>
                        <a className="text-primary hover:underline font-mono text-sm">
                          {entry.participantId}
                        </a>
                      </Link>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Participant Email</label>
                    <p className="mt-1">{entry.participantEmail || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Participant Name</label>
                    <p className="mt-1">{entry.participantName || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
                    <p className="mt-1 font-mono font-semibold">
                      {balance ? `${balance.balance} ${balance.currency}` : "Loading..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section C: Related Entities (Conditional) */}
            {(entry.campaignId || entry.commitmentId || entry.ruleSetId || entry.awardId || entry.reservationRef || entry.auditRef) && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Entities</CardTitle>
                  <CardDescription>Links to related records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entry.campaignId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Campaign</label>
                        <p className="mt-1">
                          <Link href={`/admin/campaigns/${entry.campaignId}`}>
                            <a className="text-primary hover:underline">
                              {entry.campaignName || entry.campaignId}
                            </a>
                          </Link>
                        </p>
                      </div>
                    )}
                    {entry.commitmentId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Commitment</label>
                        <p className="mt-1">
                          <Link href={`/admin/commitments/${entry.commitmentId}`}>
                            <a className="text-primary hover:underline font-mono text-sm">
                              {entry.commitmentId}
                            </a>
                          </Link>
                        </p>
                      </div>
                    )}
                    {entry.ruleSetId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Rule Set</label>
                        <p className="mt-1 font-mono text-sm">{entry.ruleSetId}</p>
                      </div>
                    )}
                    {entry.awardId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Award</label>
                        <p className="mt-1 font-mono text-sm">{entry.awardId}</p>
                      </div>
                    )}
                    {entry.reservationRef && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Reservation Ref</label>
                        <p className="mt-1 font-mono text-sm">{entry.reservationRef}</p>
                      </div>
                    )}
                    {entry.auditRef && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Audit Ref</label>
                        <p className="mt-1">
                          <Link href={`/admin/audit?ref=${entry.auditRef}`}>
                            <a className="text-primary hover:underline font-mono text-sm">
                              {entry.auditRef}
                            </a>
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
