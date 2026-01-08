import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface RefundPlanDetail {
  id: string;
  status: string;
  rowCount: number;
  totalAmount: number;
  validCount: number;
  invalidCount: number;
  campaignId: string | null;
  campaignName: string | null;
  createdAt: string;
  createdBy: string;
}

interface RefundPlanRow {
  id: string;
  commitmentCode: string;
  amount: string;
  status: string;
  errorMessage: string | null;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  EXECUTED: { label: "Executed", variant: "outline" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export default function RefundPlanDetailPage() {
  const [, params] = useRoute("/admin/refund-plans/:id");
  const planId = params?.id;

  const { data: plan, isLoading: planLoading, error: planError, refetch: refetchPlan } = useQuery<RefundPlanDetail>({
    queryKey: [`/api/admin/refund-plans/${planId}`],
    enabled: !!planId,
  });

  const { data: rows, isLoading: rowsLoading } = useQuery<RefundPlanRow[]>({
    queryKey: [`/api/admin/refund-plans/${planId}/rows`],
    enabled: !!planId,
  });

  const isLoading = planLoading || rowsLoading;
  const statusBadge = plan ? (STATUS_BADGES[plan.status] || { label: plan.status, variant: "outline" as const }) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/refund-plans">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold" data-testid="text-plan-heading">
              Refund Plan
            </h1>
            {plan && (
              <p className="text-sm text-muted-foreground font-mono">{plan.id}</p>
            )}
          </div>
          {plan && statusBadge && (
            <Badge variant={statusBadge.variant} data-testid="badge-plan-status">
              {statusBadge.label}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        ) : planError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Unable to load refund plan.</p>
              <Button variant="outline" onClick={() => refetchPlan()} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : plan ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Total Rows</p>
                    <p className="text-xl font-mono font-semibold" data-testid="stat-rows">
                      {plan.rowCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Total Amount</p>
                    <p className="text-xl font-mono font-semibold" data-testid="stat-amount">
                      ${plan.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Valid</p>
                    <p className="text-xl font-mono font-semibold text-green-600">
                      {plan.validCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Invalid</p>
                    <p className="text-xl font-mono font-semibold text-red-600">
                      {plan.invalidCount}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Created: {format(new Date(plan.createdAt), "MMM d, yyyy HH:mm")}</p>
                  <p>Created by: {plan.createdBy}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Rows</CardTitle>
                <CardDescription>Individual refund entries in this plan</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {rows && rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Commitment Code</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id} data-testid={`plan-row-${row.id}`}>
                            <TableCell className="font-mono text-xs">{row.commitmentCode}</TableCell>
                            <TableCell className="font-mono">${parseFloat(row.amount).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === "VALID" ? "outline" : "destructive"}>
                                {row.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {row.errorMessage || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No rows in this plan.</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground" data-testid="text-not-found">
                Refund plan not found.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
