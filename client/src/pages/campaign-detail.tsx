import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { StateTimeline } from "@/components/state-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Users, Calendar, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import type { Campaign, CampaignState } from "@shared/schema";

interface CampaignWithStats extends Campaign {
  participantCount: number;
  totalCommitted: number;
}

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-chart-1 text-white",
  SUCCESS: "bg-green-600 dark:bg-green-700 text-white",
  FAILED: "bg-destructive text-destructive-foreground",
  FULFILLMENT: "bg-amber-600 dark:bg-amber-700 text-white",
  RELEASED: "bg-green-700 dark:bg-green-800 text-white",
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: campaign, isLoading, error } = useQuery<CampaignWithStats>({
    queryKey: ["/api/campaigns", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-16 w-full mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button>Return to Campaigns</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const targetAmount = parseFloat(campaign.targetAmount);
  const unitPrice = parseFloat(campaign.unitPrice);
  const minCommitment = parseFloat(campaign.minCommitment);
  const maxCommitment = campaign.maxCommitment ? parseFloat(campaign.maxCommitment) : null;
  const progress = targetAmount > 0 ? Math.min((campaign.totalCommitted / targetAmount) * 100, 100) : 0;
  const isFailed = campaign.state === "FAILED";
  const canCommit = campaign.state === "AGGREGATION";

  return (
    <Layout>
      <div 
        className={`py-6 px-6 border-b ${
          isFailed 
            ? "bg-destructive/10 border-destructive/20" 
            : campaign.state === "SUCCESS" || campaign.state === "RELEASED"
            ? "bg-green-600/10 border-green-600/20"
            : "bg-card border-border"
        }`}
        data-testid="campaign-state-banner"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge className={`text-sm px-3 py-1 ${STATE_COLORS[campaign.state]}`} data-testid="badge-campaign-state">
              {campaign.state}
            </Badge>
            <h1 className="text-xl font-semibold" data-testid="campaign-title">{campaign.title}</h1>
          </div>
          <StateTimeline currentState={campaign.state as CampaignState} isFailed={isFailed} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <Card data-testid="card-rules">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-chart-1" />
              Campaign Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-transparent p-0">
                {campaign.rules}
              </pre>
            </div>
          </CardContent>
        </Card>

        {campaign.imageUrl && (
          <Card className="overflow-hidden">
            <div className="aspect-video w-full">
              <img 
                src={campaign.imageUrl} 
                alt={campaign.title}
                className="w-full h-full object-cover"
                data-testid="img-campaign"
              />
            </div>
            <CardContent className="p-6">
              <p className="text-muted-foreground">{campaign.description}</p>
            </CardContent>
          </Card>
        )}

        {!campaign.imageUrl && (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">{campaign.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card data-testid="card-participation">
            <CardHeader>
              <CardTitle>Participation Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-sm text-muted-foreground">Funding Progress</span>
                  <span className="font-mono text-sm font-medium" data-testid="text-funding-progress">
                    {campaign.totalCommitted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} / {targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% of target</p>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-participant-count">{campaign.participantCount} participants</p>
                  <p className="text-sm text-muted-foreground">have committed to this campaign</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-deadline">
                    {new Date(campaign.aggregationDeadline).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Aggregation deadline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-commitment">
            <CardHeader>
              <CardTitle>Commitment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unit Price</span>
                <span className="font-mono font-medium" data-testid="text-unit-price">
                  {unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Minimum Commitment</span>
                <span className="font-mono font-medium" data-testid="text-min-commitment">
                  {minCommitment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              {maxCommitment && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maximum Commitment</span>
                  <span className="font-mono font-medium" data-testid="text-max-commitment">
                    {maxCommitment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
              )}
              
              <Separator />

              {canCommit ? (
                <Link href={`/campaign/${id}/commit`}>
                  <Button className="w-full" size="lg" data-testid="button-commit">
                    Make a Commitment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <div className="p-4 rounded-md bg-muted text-center">
                  <p className="text-sm text-muted-foreground">
                    {isFailed 
                      ? "This campaign has failed. All funds will be refunded."
                      : campaign.state === "RELEASED"
                      ? "This campaign has been completed and funds released."
                      : "This campaign is no longer accepting new commitments."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
