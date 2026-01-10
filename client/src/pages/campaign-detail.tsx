import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  FileText,
  Users,
  Target,
  History,
  Timer
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getStatusLabel, getStatusColor } from "@/lib/campaign-status";
import type { CampaignState } from "@shared/schema";

function useCountdown(deadline: string) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean; totalHours: number } | null>(null);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;
      
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true, totalHours: 0 };
      }
      
      const totalHours = diff / (1000 * 60 * 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds, isExpired: false, totalHours };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  
  return timeLeft;
}

function CountdownDisplay({ timeLeft }: { timeLeft: { hours: number; minutes: number; seconds: number } }) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <span className="font-mono font-medium">
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}

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
  if (percent >= 100) return "Goal reached";
  if (percent >= 70) return "Approaching goal";
  if (percent >= 40) return "Gaining traction";
  return "Gathering commitments";
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

  // Countdown timer - must be called before any early returns (React hooks rule)
  // Use a fallback date when campaign is not loaded yet
  const deadlineForCountdown = campaign?.aggregationDeadline ?? new Date().toISOString();
  const timeLeft = useCountdown(deadlineForCountdown);

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
  const isSuccess = campaign.state === "SUCCESS";
  const isFulfillment = campaign.state === "FULFILLMENT";
  const isNotJoinable = isFailed || isCompleted || isSuccess || isFulfillment;
  const qualitativeLabel = getQualitativeLabel(progress);
  
  // Countdown-derived state
  const isClosingSoon = timeLeft && !timeLeft.isExpired && timeLeft.totalHours <= 24;
  const isClosingVerySoon = timeLeft && !timeLeft.isExpired && timeLeft.totalHours <= 2;
  const isCampaignClosed = timeLeft?.isExpired && campaign.state === "AGGREGATION";
  
  // Join conditions
  const canJoin = campaign.state === "AGGREGATION" && isAuthenticated && !isCampaignClosed;

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
            Join others to reach a shared goal. Your money stays protected until the campaign is accepted.
          </p>
          
          {/* State Timeline */}
          <div className="mb-6">
            <StateTimeline currentState={campaign.state as CampaignState} isFailed={isFailed} />
          </div>
          
          {/* Key Meta Row */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ends:</span>
              <span className="font-medium" data-testid="text-deadline">
                {formatDate(campaign.aggregationDeadline)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Momentum:</span>
              <span className="font-mono font-medium" data-testid="text-funding-progress">
                {Math.round(progress)}%
              </span>
            </div>
            {isAuthenticated && campaign.participantCount !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Members:</span>
                <span className="font-mono font-medium" data-testid="text-participants">
                  {campaign.participantCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Closing Soon Banner (shows when ≤ 2h remaining) */}
      {isClosingVerySoon && !isCampaignClosed && campaign.state === "AGGREGATION" && timeLeft && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3" data-testid="banner-closing-soon">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-amber-600 dark:text-amber-400">
            <Timer className="w-4 h-4" />
            <span className="font-medium">Closing soon</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm">Ends in <CountdownDisplay timeLeft={timeLeft} /></span>
          </div>
        </div>
      )}

      {/* Main Content: Two-column layout on desktop */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* C. Trust & Transparency Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-chart-1" />
                Trust & transparency
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Rules & protections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Your money is protected</span>
                          <p className="text-muted-foreground text-xs mt-0.5">Funds are locked securely and only released if the campaign is accepted.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">No silent changes</span>
                          <p className="text-muted-foreground text-xs mt-0.5">Campaign rules and key actions can't be changed without being recorded.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Full visibility</span>
                          <p className="text-muted-foreground text-xs mt-0.5">You can always see when the campaign status changes and why it changed.</p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* D. About Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">About this campaign</h2>
              
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
                Activity timeline
              </h2>
              <Card data-testid="card-activity">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-chart-1 mt-2" />
                      <div>
                        <p className="font-medium">Campaign opened</p>
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
                            ? "Campaign did not reach goal" 
                            : isCompleted 
                            ? "Campaign completed" 
                            : "Campaign ends"
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
                  <CardTitle>Join this campaign</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Countdown timer when ≤24h remaining */}
                  {isClosingSoon && !isCampaignClosed && campaign.state === "AGGREGATION" && timeLeft && (
                    <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md p-3" data-testid="countdown-cta">
                      <Timer className="w-4 h-4" />
                      <span className="text-sm">Ends in <CountdownDisplay timeLeft={timeLeft} /></span>
                    </div>
                  )}
                  
                  {/* Pricing info for authenticated users only */}
                  {isAuthenticated && hasPricingData && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Commitment amount</span>
                        <span className="font-mono font-medium" data-testid="text-unit-price">
                          {formatCurrency(unitPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Minimum commitment</span>
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
                  {isCampaignClosed ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-md bg-muted text-center">
                        <p className="text-sm text-muted-foreground">Campaign closed</p>
                      </div>
                      <Link href="/campaigns">
                        <Button variant="outline" className="w-full" data-testid="button-browse-campaigns">
                          Browse active campaigns
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : canJoin ? (
                    <div className="space-y-3">
                      <Link href={`/campaign/${id}/commit`}>
                        <Button className="w-full" size="lg" data-testid="button-commit">
                          Join campaign
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <p className="text-xs text-center text-muted-foreground">
                        You'll review key terms before confirming your commitment.
                      </p>
                    </div>
                  ) : campaign.state === "AGGREGATION" && !isAuthenticated ? (
                    <div className="space-y-3">
                      <Link href={signInUrl}>
                        <Button className="w-full" size="lg" data-testid="button-login-to-commit">
                          Sign in to join
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <p className="text-xs text-center text-muted-foreground">
                        You'll review key terms before confirming your commitment.
                      </p>
                    </div>
                  ) : isNotJoinable ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-md bg-muted text-center">
                        <p className="text-sm text-muted-foreground">
                          {isFailed 
                            ? "This campaign did not reach its goal. All funds will be refunded."
                            : isCompleted
                            ? "This campaign has been completed and funds released."
                            : "This campaign is no longer accepting new members."
                          }
                        </p>
                      </div>
                      <Link href="/campaigns">
                        <Button variant="outline" className="w-full" data-testid="button-browse-campaigns">
                          Browse active campaigns
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 rounded-md bg-muted text-center">
                      <p className="text-sm text-muted-foreground">
                        This campaign is no longer accepting new members.
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
                        <div>
                          <span className="font-medium text-foreground">Your funds are locked safely</span>
                          <p className="text-xs mt-0.5">Money is secured while the campaign is active.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-chart-1 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">No risk if it doesn't go through</span>
                          <p className="text-xs mt-0.5">If the campaign isn't accepted or doesn't complete, you get a full refund.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-chart-1 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Nothing happens behind the scenes</span>
                          <p className="text-xs mt-0.5">Every important action is recorded and visible.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* P1-C: Sticky CTA when user scrolls past Join card */}
      {campaign.state === "AGGREGATION" && !isCampaignClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t px-6 py-4 lg:hidden" data-testid="sticky-cta">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isClosingSoon && timeLeft && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    <CountdownDisplay timeLeft={timeLeft} />
                  </span>
                </div>
              )}
              <span className="text-sm font-medium truncate">{campaign.title}</span>
            </div>
            {isAuthenticated ? (
              <Link href={`/campaign/${id}/commit`}>
                <Button size="sm" data-testid="button-sticky-commit">
                  Join
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link href={signInUrl}>
                <Button size="sm" data-testid="button-sticky-signin">
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
