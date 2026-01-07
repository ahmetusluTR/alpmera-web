import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { Layout } from "@/components/layout";
import { StateTimeline } from "@/components/state-timeline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Lock, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Commitment, Campaign, CampaignState } from "@shared/schema";

interface CommitmentWithCampaign extends Commitment {
  campaign: Campaign;
}

const STATUS_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  LOCKED: { bg: "bg-chart-1 text-white", icon: <Lock className="w-3.5 h-3.5" /> },
  REFUNDED: { bg: "bg-amber-600 text-white", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  RELEASED: { bg: "bg-green-600 text-white", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

export default function StatusPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const refFromUrl = params.get("ref") || "";
  
  const [referenceNumber, setReferenceNumber] = useState(refFromUrl);
  const [searchRef, setSearchRef] = useState(refFromUrl);

  useEffect(() => {
    if (refFromUrl) {
      setReferenceNumber(refFromUrl);
      setSearchRef(refFromUrl);
    }
  }, [refFromUrl]);

  const { data: commitment, isLoading, error, refetch } = useQuery<CommitmentWithCampaign>({
    queryKey: ["/api/commitments", searchRef],
    enabled: !!searchRef,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchRef(referenceNumber.trim());
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" data-testid="status-page-title">Check Commitment Status</h1>
          <p className="text-muted-foreground">
            Enter your reference number to view the status of your commitment.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="reference" className="sr-only">Reference Number</Label>
                <Input
                  id="reference"
                  placeholder="Enter your reference number (e.g., ALM-XXXX-XXXX)"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="font-mono"
                  data-testid="input-reference"
                />
              </div>
              <Button type="submit" disabled={!referenceNumber.trim()} data-testid="button-search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && searchRef && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {error && searchRef && (
          <Card>
            <CardContent className="py-8 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Commitment Not Found</h3>
              <p className="text-muted-foreground text-sm">
                No commitment found with reference number: <code className="font-mono">{searchRef}</code>
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Please check your reference number and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {commitment && (
          <Card data-testid="commitment-details-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Commitment Details</CardTitle>
                  <CardDescription className="font-mono mt-1" data-testid="text-ref-number">
                    {commitment.referenceNumber}
                  </CardDescription>
                </div>
                <Badge className={`shrink-0 flex items-center gap-1.5 ${STATUS_STYLES[commitment.status].bg}`} data-testid="badge-commitment-status">
                  {STATUS_STYLES[commitment.status].icon}
                  {commitment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participant</span>
                  <span className="font-medium" data-testid="text-participant-name">{commitment.participantName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm" data-testid="text-participant-email">{commitment.participantEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span className="font-mono font-medium" data-testid="text-quantity">{commitment.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-mono font-medium" data-testid="text-amount">
                    {parseFloat(commitment.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Committed At</span>
                  <span className="text-sm" data-testid="text-committed-at">
                    {new Date(commitment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Campaign Status</h4>
                <Link href={`/campaign/${commitment.campaign.id}`} className="block">
                  <div className="bg-muted/50 rounded-md p-4 hover-elevate active-elevate-2 cursor-pointer">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h5 className="font-medium" data-testid="text-campaign-title">{commitment.campaign.title}</h5>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {commitment.campaign.description}
                        </p>
                      </div>
                      <Badge className="shrink-0" data-testid="badge-campaign-state">
                        {commitment.campaign.state}
                      </Badge>
                    </div>
                    <StateTimeline 
                      currentState={commitment.campaign.state as CampaignState} 
                      isFailed={commitment.campaign.state === "FAILED"} 
                    />
                  </div>
                </Link>
              </div>

              {commitment.status === "LOCKED" && (
                <div className="flex items-start gap-3 p-4 bg-chart-1/10 border border-chart-1/20 rounded-md">
                  <Lock className="w-5 h-5 text-chart-1 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-chart-1">Funds Locked in Escrow</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your commitment is secure. Funds will be released upon campaign fulfillment or refunded if the campaign fails.
                    </p>
                  </div>
                </div>
              )}

              {commitment.status === "REFUNDED" && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                  <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Funds Refunded</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      The campaign did not meet its target. Your full commitment has been refunded.
                    </p>
                  </div>
                </div>
              )}

              {commitment.status === "RELEASED" && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Funds Released</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      The campaign has been successfully fulfilled. Your funds have been released to the supplier.
                    </p>
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={() => refetch()} className="w-full" data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
