import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AccountLayout } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

interface RefundEntry {
  id: string;
  entryType: "REFUND";
  amount: string;
  createdAt: string;
  reason: string;
  actor: string;
  commitmentCode: string;
  campaignId: string;
  campaignName: string;
}

function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    campaign_failed_refund: "Campaign failed",
    admin_refund: "Admin refund",
  };
  return reasonMap[reason] || reason;
}

export default function RefundsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: refunds, isLoading, error, refetch } = useQuery<RefundEntry[]>({
    queryKey: ["/api/account/refunds"],
    enabled: isAuthenticated,
  });

  const handleRowClick = (refundId: string) => {
    setLocation(`/account/refunds/${refundId}`);
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Refunds</CardTitle>
            </div>
            <CardDescription>
              Escrow funds returned from failed campaigns
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
                <p className="text-muted-foreground mb-4">Unable to load refunds.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : !refunds || refunds.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="text-empty-refunds">
                No refunds yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-refunds">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Reason</th>
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className="border-b last:border-0 hover-elevate cursor-pointer"
                        onClick={() => handleRowClick(refund.id)}
                        data-testid={`row-refund-${refund.id}`}
                      >
                        <td className="py-3 font-mono text-xs">
                          {format(new Date(refund.createdAt), "yyyy-MM-dd HH:mm")}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Completed
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {formatReason(refund.reason)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{refund.commitmentCode}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {refund.campaignName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
    </AccountLayout>
  );
}
