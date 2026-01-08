import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, RefreshCw, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

interface CampaignListItem {
  id: string;
  title: string;
  state: string;
  aggregationDeadline: string;
  participantCount: number;
  totalCommitted: number;
  createdAt: string;
}

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-blue-500 text-white",
  SUCCESS: "bg-green-600 text-white",
  FAILED: "bg-red-500 text-white",
  FULFILLMENT: "bg-amber-500 text-white",
  RELEASED: "bg-green-700 text-white",
};

export default function CampaignsListPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");

  const { data: campaigns, isLoading, error, refetch } = useQuery<CampaignListItem[]>({
    queryKey: ["/api/admin/campaigns"],
  });

  const filteredCampaigns = campaigns
    ?.filter((c) => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "deadline") {
        return new Date(a.aggregationDeadline).getTime() - new Date(b.aggregationDeadline).getTime();
      }
      if (sortBy === "participants") {
        return b.participantCount - a.participantCount;
      }
      return 0;
    }) || [];

  const handleRowClick = (campaignId: string) => {
    setLocation(`/admin/campaigns/${campaignId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-campaigns-heading">Campaigns</h1>
          <p className="text-muted-foreground text-sm">Manage campaign lifecycle and commitments</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-campaigns"
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-state-filter">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="AGGREGATION">Aggregation</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="FULFILLMENT">Fulfillment</SelectItem>
              <SelectItem value="RELEASED">Released</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]" data-testid="select-sort">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="participants">Participants</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Unable to load campaigns.</p>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No campaigns found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Commitments</TableHead>
                      <TableHead className="text-right">Escrow Locked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => handleRowClick(campaign.id)}
                        data-testid={`row-campaign-${campaign.id}`}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {campaign.title}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATE_COLORS[campaign.state] || "bg-muted"}>
                            {campaign.state}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(campaign.aggregationDeadline), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {campaign.participantCount}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${campaign.totalCommitted.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
