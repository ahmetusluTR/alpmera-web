import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, User, Mail, Phone, Calendar, CreditCard, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ParticipantIdentity {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
  profile: any | null;
}

interface ParticipantSummary {
  activeCommitmentsCount: number;
  totalCommittedEscrow: string;
  creditBalance: string;
  creditCurrency: string;
  refundsPending: number;
}

interface ParticipantDetail {
  identity: ParticipantIdentity;
  summary: ParticipantSummary;
}

interface Commitment {
  id: string;
  referenceNumber: string;
  campaignId: string;
  campaignTitle: string | null;
  units: number;
  totalAmount: string;
  createdAt: string;
}

interface CommitmentsResponse {
  commitments: Commitment[];
  total: number;
}

interface CreditEntry {
  id: string;
  eventType: string;
  amount: string;
  currency: string;
  campaignId: string | null;
  campaignName: string | null;
  reason: string;
  createdAt: string;
}

interface CreditsResponse {
  entries: CreditEntry[];
  total: number;
}

interface Refund {
  id: string;
  amount: string;
  createdAt: string;
  reason: string;
  campaignTitle: string;
  commitmentReference: string;
}

interface RefundsResponse {
  refunds: Refund[];
}

export default function ParticipantDetailPage() {
  const [, params] = useRoute("/admin/participants/:id");
  const participantId = params?.id;

  const { data: participant, isLoading, error } = useQuery<ParticipantDetail>({
    queryKey: ["/api/admin/participants", participantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/participants/${participantId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!participantId,
  });

  const { data: commitments } = useQuery<CommitmentsResponse>({
    queryKey: ["/api/admin/participants", participantId, "commitments"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/participants/${participantId}/commitments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!participantId,
  });

  const { data: credits } = useQuery<CreditsResponse>({
    queryKey: ["/api/admin/credits", participantId],
    queryFn: async () => {
      const params = new URLSearchParams({
        participantId: participantId!,
        limit: "10",
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

  const { data: refunds } = useQuery<RefundsResponse>({
    queryKey: ["/api/admin/participants", participantId, "refunds"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/participants/${participantId}/refunds`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!participantId,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-8 text-muted-foreground">
          Loading participant details...
        </div>
      </AdminLayout>
    );
  }

  if (error || !participant) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">⚠️ Error loading participant</p>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Participant not found"}
          </p>
          <Link href="/admin/participants">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Participants
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/participants">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Participant Detail</h1>
            <p className="text-muted-foreground mt-1">
              {participant.identity.email}
            </p>
          </div>
        </div>

        {/* Identity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Participant ID
                </div>
                <p className="font-mono text-sm">{participant.identity.id}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p>{participant.identity.email}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                <p>
                  {participant.identity.fullName || (
                    <span className="text-muted-foreground italic">No name</span>
                  )}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </div>
                <p>
                  {participant.identity.phoneNumber || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  Created
                </div>
                <p>
                  {format(new Date(participant.identity.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Commitments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {participant.summary.activeCommitmentsCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Committed (Lifetime)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${parseFloat(participant.summary.totalCommittedEscrow).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ${parseFloat(participant.summary.creditBalance).toFixed(2)} {participant.summary.creditCurrency}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Refunds Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {participant.summary.refundsPending}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="commitments" className="w-full">
          <TabsList>
            <TabsTrigger value="commitments">
              <FileText className="w-4 h-4 mr-2" />
              Commitments
            </TabsTrigger>
            <TabsTrigger value="credits">
              <CreditCard className="w-4 h-4 mr-2" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="refunds">
              <DollarSign className="w-4 h-4 mr-2" />
              Refunds
            </TabsTrigger>
          </TabsList>

          {/* Commitments Tab */}
          <TabsContent value="commitments">
            <Card>
              <CardHeader>
                <CardTitle>Commitments</CardTitle>
                <CardDescription>All commitments made by this participant</CardDescription>
              </CardHeader>
              <CardContent>
                {!commitments || commitments.commitments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No commitments found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference #</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commitments.commitments.map((commitment) => (
                          <TableRow key={commitment.id}>
                            <TableCell className="font-mono text-sm">
                              {commitment.referenceNumber}
                            </TableCell>
                            <TableCell>
                              <Link href={`/admin/campaigns/${commitment.campaignId}`}>
                                <a className="text-primary hover:underline">
                                  {commitment.campaignTitle || "Unknown"}
                                </a>
                              </Link>
                            </TableCell>
                            <TableCell>{commitment.units}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${parseFloat(commitment.totalAmount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(commitment.createdAt), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Credit Ledger</CardTitle>
                    <CardDescription>Recent credit events (showing last 10)</CardDescription>
                  </div>
                  <Link href={`/admin/participants/${participantId}/credits`}>
                    <Button variant="outline" size="sm">
                      View Full Credits
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {!credits || credits.entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No credit history
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {credits.entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {format(new Date(entry.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              <span className={parseFloat(entry.amount) >= 0 ? "text-green-600" : "text-red-600"}>
                                {parseFloat(entry.amount) >= 0 ? "+" : ""}
                                {parseFloat(entry.amount).toFixed(2)} {entry.currency}
                              </span>
                            </TableCell>
                            <TableCell>
                              {entry.campaignId ? (
                                <Link href={`/admin/campaigns/${entry.campaignId}`}>
                                  <a className="text-primary hover:underline">
                                    {entry.campaignName || entry.campaignId.slice(0, 8)}
                                  </a>
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={entry.reason}>
                              {entry.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds">
            <Card>
              <CardHeader>
                <CardTitle>Refunds</CardTitle>
                <CardDescription>Refund history for this participant</CardDescription>
              </CardHeader>
              <CardContent>
                {!refunds || refunds.refunds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No refunds found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Commitment</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refunds.refunds.map((refund) => (
                          <TableRow key={refund.id}>
                            <TableCell>
                              {format(new Date(refund.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${parseFloat(refund.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>{refund.campaignTitle}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {refund.commitmentReference}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={refund.reason}>
                              {refund.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
