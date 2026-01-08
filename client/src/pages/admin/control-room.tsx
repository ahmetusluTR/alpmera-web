import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileStack,
  Wallet,
  RotateCcw,
  Truck,
  RefreshCw,
  ArrowRight
} from "lucide-react";

interface ControlRoomData {
  tiles: {
    campaignsInAggregation: number;
    campaignsNeedingAction: number;
    pendingRefunds: number;
    overdueDeliveries: number;
    totalEscrowLocked: number;
  };
  queues: {
    needsAction: Array<{ id: string; title: string; state: string; deadline: string }>;
    recentRefunds: Array<{ id: string; amount: string; campaignName: string; createdAt: string }>;
    overdueDeliveries: Array<{ campaignId: string; campaignName: string; daysOverdue: number }>;
  };
}

export default function ControlRoomPage() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error, refetch } = useQuery<ControlRoomData>({
    queryKey: ["/api/admin/control-room"],
  });

  const navigateToCampaign = (campaignId: string) => {
    setLocation(`/admin/campaigns/${campaignId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-control-room-heading">Control Room</h1>
          <p className="text-muted-foreground text-sm">Overview of platform activity and action items</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Unable to load control room data.</p>
              <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="min-h-[100px]">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <FileStack className="w-4 h-4" />
                    Campaigns Aggregating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="tile-aggregating">
                    {data?.tiles.campaignsInAggregation ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="min-h-[100px]">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Needs Action
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="tile-needs-action">
                    {data?.tiles.campaignsNeedingAction ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="min-h-[100px]">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Pending Refunds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="tile-pending-refunds">
                    {data?.tiles.pendingRefunds ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="min-h-[100px]">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Total Escrow Locked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold font-mono" data-testid="tile-escrow-locked">
                    ${(data?.tiles.totalEscrowLocked ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Campaigns Needing Action</CardTitle>
                    <Link href="/admin/campaigns?needsAction=true">
                      <Button variant="ghost" size="sm">
                        View all <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {data?.queues.needsAction && data.queues.needsAction.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Deadline</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.queues.needsAction.slice(0, 5).map((item) => (
                          <TableRow 
                            key={item.id} 
                            className="cursor-pointer hover-elevate"
                            onClick={() => navigateToCampaign(item.id)}
                            data-testid={`queue-row-${item.id}`}
                          >
                            <TableCell className="font-medium truncate max-w-[150px]">{item.title}</TableCell>
                            <TableCell><Badge variant="outline">{item.state}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(item.deadline).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No campaigns need action</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Overdue Deliveries</CardTitle>
                    <Link href="/admin/deliveries?overdue=true">
                      <Button variant="ghost" size="sm">
                        View all <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {data?.queues.overdueDeliveries && data.queues.overdueDeliveries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Days Overdue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.queues.overdueDeliveries.slice(0, 5).map((item) => (
                          <TableRow key={item.campaignId} data-testid={`overdue-row-${item.campaignId}`}>
                            <TableCell className="font-medium truncate max-w-[200px]">{item.campaignName}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{item.daysOverdue} days</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No overdue deliveries</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
