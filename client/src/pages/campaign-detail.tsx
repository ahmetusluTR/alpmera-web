import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { StateTimeline } from "@/components/state-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Target,
  Wallet,
  History
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getStatusLabel, getStatusColor } from "@/lib/campaign-status";
import type { CampaignState } from "@shared/schema";

interface PublicCampaignDetail {
  id: string;
  title: string;
  description: string;
  rules: string;
  state: string;
  imageUrl?: string | null;
  progressPercent?: number;
  aggregationDeadline: string;
  createdAt: string;
  targetAmount?: string;
  unitPrice?: string;
  minCommitment?: string;
  maxCommitment?: string | null;
  participantCount?: number;
  totalCommitted?: number;
}

function getQualitativeLabel(percent: number): string {
  if (percent >= 100) return "Target reached";
  if (percent >= 70) return "Approaching target";
  if (percent >= 40) return "Gaining traction";
  return "Building momentum";
}

function ProgressBarWithMilestones({ value }: { value: number }) {
  return (
    <div className="relative">
      <Progress value={value} className="h-2" />
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="absolute left-1/4 w-px h-3 bg-muted-foreground/30 -translate-x-1/2" />
        <div className="absolute left-1/2 w-px h-3 bg-muted-foreground/30 -translate-x-1/2" />
        <div className="absolute left-3/4 w-px h-3 bg-muted-foreground/30 -translate-x-1/2" />
      </div>
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const signInUrl = `/signin?next=${encodeURIComponent(`/campaign/${id}`)}`;
  
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/campaigns");
    }
  };

  const { data: campaign, isLoading, error } = useQuery<PublicCampaignDetail>({
    queryKey: ["/api/campaigns", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
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
          <Link href="/campaigns">
            <Button>Return to Campaigns</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasPricingData = campaign.targetAmount !== undefined;
  const targetAmount = hasPricingData ? parseFloat(campaign.targetAmount!) : 0;
  const unitPrice = hasPricingData ? parseFloat(campaign.unitPrice!) : 0;
  const minCommitment = hasPricingData ? parseFloat(campaign.minCommitment!) : 0;
  const maxCommitment = hasPricingData && campaign.maxCommitment ? parseFloat(campaign.maxCommitment) : null;
  const totalCommitted = campaign.totalCommitted ?? 0;
  
  const progress = campaign.progressPercent !== undefined 
    ? campaign.progressPercent 
    : (hasPricingData && targetAmount > 0 ? Math.min((totalCommitted / targetAmount) * 100, 100) : 0);
  
  const isFailed = campaign.state === "FAILED";
  const isCompleted = campaign.state === "RELEASED";
  const canJoin = campaign.state === "AGGREGATION" && isAuthenticated;
  const qualitativeLabel = getQualitativeLabel(progress);

  const formatCurrency = (amount: number) => 
    amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <Layout>
      {/* A. Header / Hero Section */}
      <div 
        className={`py-8 px-6 border-b ${
          isFailed 
            ? "bg-destructive/5 border-destructive/20" 
            : isCompleted
            ? "bg-green-600/5 border-green-600/20"
            : "bg-muted/30 border-border"
        }`}
        data-testid="campaign-state-banner"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Badge className={`text-sm px-3 py-1 ${getStatusColor(campaign.state)}`} data-testid="badge-campaign-state">
              {getStatusLabel(campaign.state)}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold mb-2" data-testid="campaign-title">
            {campaign.title}
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            A collective campaign where participants join together to reach a shared goal.
          </p>
          
          {/* State Timeline */}
          <div className="mb-6">
            <StateTimeline currentState={campaign.state as CampaignState} isFailed={isFailed} />
          </div>
          
          {/* Key Meta Row */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Closes:</span>
              <span className="font-medium" data-testid="text-deadline">
                {formatDate(campaign.aggregationDeadline)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-mono font-medium" data-testid="text-funding-progress">
                {Math.round(progress)}%
              </span>
            </div>
            {hasPricingData && campaign.participantCount !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Participants:</span>
                <span className="font-mono font-medium" data-testid="text-participants">
                  {campaign.participantCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Two-column layout on desktop */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* C. Transparency Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-chart-1" />
                Transparency
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Escrow Status Card */}
                <Card data-testid="card-escrow-status">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Escrow Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasPricingData ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">In escrow</span>
                          <span className="font-mono font-medium">{formatCurrency(totalCommitted)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-mono font-medium">{formatCurrency(targetAmount)}</span>
                        </div>
                        <ProgressBarWithMilestones value={progress} />
                        <p className="text-xs text-muted-foreground">{qualitativeLabel}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sign in to view escrow details.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Campaign Status Card */}
                <Card data-testid="card-status">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(campaign.state)}`}>
                          {getStatusLabel(campaign.state)}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span className="font-mono text-xs">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deadline</span>
                          <span className="font-mono text-xs">{new Date(campaign.aggregationDeadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rules & Protections Card */}
                <Card data-testid="card-protections">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Rules & Protections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Append-only records</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Idempotent operations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Auditable timeline</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* D. Details Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
              
              {campaign.imageUrl && (
                <Card className="overflow-hidden mb-4">
                  <div className="aspect-video w-full">
                    <img 
                      src={campaign.imageUrl} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                      data-testid="img-campaign"
                    />
                  </div>
                </Card>
              )}
              
              <Card data-testid="card-description">
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* E. Timeline Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-chart-1" />
                Campaign Activity
              </h2>
              <Card data-testid="card-activity">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-chart-1 mt-2" />
                      <div>
                        <p className="font-medium">Campaign created</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        isFailed ? "bg-destructive" : isCompleted ? "bg-green-600" : "bg-muted-foreground/30"
                      }`} />
                      <div>
                        <p className="font-medium">
                          {isFailed 
                            ? "Campaign did not reach target" 
                            : isCompleted 
                            ? "Campaign completed" 
                            : "Campaign closes"
                          }
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {formatDate(campaign.aggregationDeadline)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* F. Participation Terms */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Participation Terms</h2>
              <Card data-testid="card-rules">
                <CardContent className="p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-transparent p-0">
                      {campaign.rules}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* B. Right Column: Primary Actions Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card data-testid="card-actions">
                <CardHeader>
                  <CardTitle>Join this Campaign</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Pricing info for authenticated users */}
                  {hasPricingData && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Unit price</span>
                        <span className="font-mono font-medium" data-testid="text-unit-price">
                          {formatCurrency(unitPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Minimum</span>
                        <span className="font-mono font-medium" data-testid="text-min-commitment">
                          {formatCurrency(minCommitment)}
                        </span>
                      </div>
                      {maxCommitment && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Maximum</span>
                          <span className="font-mono font-medium" data-testid="text-max-commitment">
                            {formatCurrency(maxCommitment)}
                          </span>
                        </div>
                      )}
                      <Separator />
                    </div>
                  )}

                  {/* CTA Button */}
                  {canJoin ? (
                    <Link href={`/campaign/${id}/commit`}>
                      <Button className="w-full" size="lg" data-testid="button-commit">
                        Join campaign
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : campaign.state === "AGGREGATION" && !isAuthenticated ? (
                    <Link href={signInUrl}>
                      <Button className="w-full" size="lg" data-testid="button-login-to-commit">
                        Sign in to join
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="p-4 rounded-md bg-muted text-center">
                      <p className="text-sm text-muted-foreground">
                        {isFailed 
                          ? "This campaign did not reach its target. All funds will be refunded."
                          : isCompleted
                          ? "This campaign has been completed and funds released."
                          : "This campaign is no longer accepting new participants."
                        }
                      </p>
                    </div>
                  )}

                  {/* Participation Rules */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Participation rules
                    </p>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-chart-1 mt-0.5 flex-shrink-0" />
                        <span>Funds are locked in escrow during the campaign</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-chart-1 mt-0.5 flex-shrink-0" />
                        <span>If the campaign is not accepted or fails, funds are refunded</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-chart-1 mt-0.5 flex-shrink-0" />
                        <span>All money movements are recorded with reason and actor</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
