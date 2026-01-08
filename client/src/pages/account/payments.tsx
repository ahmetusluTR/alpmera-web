import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AccountLayout } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, Lock, Unlock, RotateCcw, Wallet } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

interface EscrowMovement {
  id: string;
  entryType: "LOCK" | "REFUND" | "RELEASE";
  amount: string;
  createdAt: string;
  reason: string;
  actor: string;
  commitmentCode: string;
  campaignId: string;
  campaignName: string;
}

function getEntryTypeBadge(entryType: EscrowMovement["entryType"]) {
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

export default function PaymentsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: movements, isLoading, error, refetch } = useQuery<EscrowMovement[]>({
    queryKey: ["/api/account/escrow"],
    enabled: isAuthenticated,
  });

  const handleRowClick = (movementId: string) => {
    setLocation(`/account/escrow/${movementId}`);
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Payments & Escrow</CardTitle>
            </div>
            <CardDescription>
              Append-only record of all escrow movements
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
                <p className="text-muted-foreground mb-4">Unable to load escrow movements.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : !movements || movements.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="text-empty-escrow">
                No escrow movements yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-escrow-movements">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Reason</th>
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => {
                      const entryBadge = getEntryTypeBadge(movement.entryType);
                      const Icon = entryBadge.icon;
                      return (
                        <tr
                          key={movement.id}
                          className="border-b last:border-0 hover-elevate cursor-pointer"
                          onClick={() => handleRowClick(movement.id)}
                          data-testid={`row-escrow-${movement.id}`}
                        >
                          <td className="py-3 font-mono text-xs">
                            {format(new Date(movement.createdAt), "yyyy-MM-dd HH:mm")}
                          </td>
                          <td className="py-3">
                            <Badge variant={entryBadge.variant} className="gap-1">
                              <Icon className="w-3 h-3" />
                              {entryBadge.label}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {formatReason(movement.reason)}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs">{movement.commitmentCode}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {movement.campaignName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
