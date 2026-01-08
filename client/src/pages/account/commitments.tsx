import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Package, ChevronRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { AccountLayout } from "./layout";

interface CommitmentListItem {
  id: string;
  referenceNumber: string;
  userId: string | null;
  quantity: number;
  status: string;
  createdAt: string;
  lastCampaignStatusUpdate: string;
  campaign: {
    id: string;
    title: string;
    state: string;
    createdAt: string;
  };
}

function getCampaignStatusBadge(state: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (state) {
    case "AGGREGATION":
      return { label: "Aggregating", variant: "default" };
    case "SUCCESS":
      return { label: "Target reached", variant: "default" };
    case "FULFILLMENT":
      return { label: "Fulfilling", variant: "default" };
    case "RELEASED":
      return { label: "Completed", variant: "outline" };
    case "FAILED":
      return { label: "Failed", variant: "secondary" };
    default:
      return { label: state, variant: "secondary" };
  }
}

function getCommitmentStatusBadge(commitmentStatus: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (commitmentStatus) {
    case "LOCKED":
      return { label: "Locked", variant: "default" };
    case "REFUNDED":
      return { label: "Refunded", variant: "secondary" };
    case "RELEASED":
      return { label: "Released", variant: "outline" };
    default:
      return { label: commitmentStatus, variant: "secondary" };
  }
}

export default function CommitmentsPage() {
  const { isAuthenticated } = useAuth();

  const { data: commitments, isLoading, isError, refetch, isFetching } = useQuery<CommitmentListItem[]>({
    queryKey: ["/api/account/commitments"],
    enabled: isAuthenticated,
  });

  return (
    <AccountLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">My Commitments</CardTitle>
            </div>
          </div>
          <CardDescription>
            Your campaign commitments and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-muted-foreground">Unable to load commitments.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-retry-commitments"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          ) : commitments && commitments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Commitment Code</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Campaign Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground whitespace-nowrap">Last Status Update</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Your Status</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {commitments.map((commitment) => {
                    const campaignStatus = getCampaignStatusBadge(commitment.campaign.state);
                    const commitmentStatus = getCommitmentStatusBadge(commitment.status);
                    return (
                      <tr 
                        key={commitment.id} 
                        className="border-b last:border-b-0 hover-elevate"
                        data-testid={`commitment-row-${commitment.id}`}
                      >
                        <td className="py-3 px-2">
                          <span className="font-medium">{commitment.campaign.title}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-xs" data-testid={`text-code-${commitment.id}`}>
                            {commitment.referenceNumber}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {format(new Date(commitment.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={campaignStatus.variant} className="text-xs">
                            {campaignStatus.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {format(new Date(commitment.lastCampaignStatusUpdate), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={commitmentStatus.variant} className="text-xs">
                            {commitmentStatus.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link href={`/account/commitments/${commitment.referenceNumber}`}>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-view-${commitment.id}`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No commitments yet
            </p>
          )}
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
