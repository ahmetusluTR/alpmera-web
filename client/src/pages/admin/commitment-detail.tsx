import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface CommitmentDetail {
  id: string;
  referenceNumber: string;
  participantName: string;
  participantEmail: string;
  userId: string | null;
  campaignId: string;
  campaignTitle: string | null;
  quantity: number;
  amount: string;
  status: string;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  LOCKED: { label: "Active", variant: "default" },
  RELEASED: { label: "Released", variant: "outline" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

export default function AdminCommitmentDetailPage() {
  const [, params] = useRoute("/admin/commitments/:id");
  const commitmentId = params?.id;

  const { data: commitment, isLoading, error } = useQuery<CommitmentDetail>({
    queryKey: ["/api/admin/commitments", commitmentId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/commitments/${commitmentId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!commitmentId,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-8 text-muted-foreground">
          Loading commitment details...
        </div>
      </AdminLayout>
    );
  }

  if (error || !commitment) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Error loading commitment</p>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Commitment not found"}
          </p>
          <Link href="/admin/commitments">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Commitments
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/commitments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commitment Detail</h1>
            <p className="text-muted-foreground mt-1">{commitment.referenceNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Commitment ID</div>
              <div className="font-mono text-sm">{commitment.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Reference #</div>
              <div className="font-mono text-sm">{commitment.referenceNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={STATUS_BADGES[commitment.status]?.variant || "outline"}>
                {STATUS_BADGES[commitment.status]?.label || commitment.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div>{format(new Date(commitment.createdAt), "MMM d, yyyy HH:mm")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Records</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Participant</div>
              <div className="font-medium">{commitment.participantName}</div>
              <div className="text-xs text-muted-foreground">{commitment.participantEmail}</div>
              {commitment.userId ? (
                <Link href={`/admin/participants/${commitment.userId}`}>
                  <a className="text-sm text-primary hover:underline">View participant</a>
                </Link>
              ) : (
                <div className="text-xs text-muted-foreground">No participant ID</div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Campaign</div>
              <div className="font-medium">{commitment.campaignTitle || commitment.campaignId}</div>
              <div className="text-xs text-muted-foreground">{commitment.campaignId}</div>
              <Link href={`/admin/campaigns/${commitment.campaignId}`}>
                <a className="text-sm text-primary hover:underline">View campaign</a>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Quantity</div>
              <div>{commitment.quantity}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-mono">${parseFloat(commitment.amount).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">User ID</div>
              <div className="font-mono text-sm">{commitment.userId || "—"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
