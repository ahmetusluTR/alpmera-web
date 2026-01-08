import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowRight, Lock, Unlock, RotateCcw, RefreshCw } from "lucide-react";

interface ClearingSnapshot {
  inEscrow: number;
  released: number;
  returned: number;
  currency: string;
}

export default function ClearingPage() {
  const { data: snapshot, isLoading, error, refetch } = useQuery<ClearingSnapshot>({
    queryKey: ["/api/admin/clearing/snapshot"],
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-clearing-heading">Clearing</h1>
          <p className="text-muted-foreground text-sm">Escrow fund positions and movements</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Unable to load clearing data.</p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    In Escrow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="stat-in-escrow">
                    ${(snapshot?.inEscrow ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{snapshot?.currency || "USD"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-green-500" />
                    Released
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="stat-released">
                    ${(snapshot?.released ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{snapshot?.currency || "USD"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    Returned (Refunded)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="stat-returned">
                    ${(snapshot?.returned ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{snapshot?.currency || "USD"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ledger Explorer</CardTitle>
                <CardDescription>View and filter all escrow movements</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/clearing/ledger">
                  <Button data-testid="button-open-ledger">
                    <Wallet className="w-4 h-4 mr-2" />
                    Open Ledger Explorer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
