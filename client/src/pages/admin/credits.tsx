import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

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

interface CreditLedgerResponse {
  entries: CreditLedgerEntry[];
  total: number;
  limit: number;
  offset: number;
}

export default function CreditsPage() {
  const [, setLocation] = useLocation();
  const [participantId, setParticipantId] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Build query params
  const params = new URLSearchParams();
  if (participantId) params.append("participantId", participantId);
  if (eventTypeFilter && eventTypeFilter !== "all") params.append("eventType", eventTypeFilter);
  if (fromDate) params.append("from", fromDate);
  if (toDate) params.append("to", toDate);
  params.append("limit", "50");
  params.append("offset", "0");

  const { data, isLoading, error } = useQuery<CreditLedgerResponse>({
    queryKey: ["/api/admin/credits", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/credits?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const handleClearFilters = () => {
    setParticipantId("");
    setEventTypeFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
          <p className="text-muted-foreground mt-2">
            Append-only ledger of all Alpmera Credit events
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter credit ledger entries by participant, event type, or date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="participantId" className="text-sm font-medium">
                  Participant ID
                </label>
                <Input
                  id="participantId"
                  placeholder="Search by participant ID"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="eventType" className="text-sm font-medium">
                  Event Type
                </label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="All event types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ISSUED">ISSUED</SelectItem>
                    <SelectItem value="RESERVED">RESERVED</SelectItem>
                    <SelectItem value="RELEASED">RELEASED</SelectItem>
                    <SelectItem value="APPLIED">APPLIED</SelectItem>
                    <SelectItem value="REVOKED">REVOKED</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="fromDate" className="text-sm font-medium">
                  From Date
                </label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="toDate" className="text-sm font-medium">
                  To Date
                </label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Ledger Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Ledger Entries</CardTitle>
            <CardDescription>
              {data ? `${data.total} total entries` : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading credit ledger entries...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-destructive">
                Error loading entries: {error.message}
              </div>
            )}

            {data && data.entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No credit ledger entries found
              </div>
            )}

            {data && data.entries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Created At</th>
                      <th className="text-left py-3 px-4 font-medium">Participant</th>
                      <th className="text-left py-3 px-4 font-medium">Event Type</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Campaign</th>
                      <th className="text-left py-3 px-4 font-medium">Reason</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm">
                          {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Link href={`/admin/participants/${entry.participantId}`}>
                            <a className="text-primary hover:underline">
                              {entry.participantEmail || entry.participantId.slice(0, 8)}
                            </a>
                          </Link>
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
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/admin/credits/${entry.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
