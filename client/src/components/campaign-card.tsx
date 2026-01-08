import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";

interface PublicCampaign {
  id: string;
  title: string;
  description: string;
  state: string;
  imageUrl?: string | null;
  progressPercent: number;
  aggregationDeadline: string;
}

interface CampaignCardProps {
  campaign: PublicCampaign;
}

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-chart-1 text-white",
  SUCCESS: "bg-green-600 dark:bg-green-700 text-white",
  FAILED: "bg-destructive text-destructive-foreground",
  FULFILLMENT: "bg-amber-600 dark:bg-amber-700 text-white",
  RELEASED: "bg-green-700 dark:bg-green-800 text-white",
};

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

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { isAuthenticated } = useAuth();
  const progress = campaign.progressPercent || 0;
  const qualitativeLabel = getQualitativeLabel(progress);

  return (
    <Link href={`/campaign/${campaign.id}`}>
      <Card 
        className="overflow-visible cursor-pointer hover-elevate active-elevate-2 transition-all duration-200"
        data-testid={`card-campaign-${campaign.id}`}
      >
        {campaign.imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-md">
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-medium text-lg leading-tight">{campaign.title}</h3>
            <Badge className={`shrink-0 ${STATE_COLORS[campaign.state]}`} data-testid={`badge-state-${campaign.id}`}>
              {campaign.state}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {campaign.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-medium" data-testid={`text-progress-${campaign.id}`}>
                {progress}%
              </span>
            </div>
            
            <ProgressBarWithMilestones value={progress} />
            
            <p className="text-xs text-muted-foreground" data-testid={`text-label-${campaign.id}`}>
              {qualitativeLabel}
            </p>
            
            {isAuthenticated ? (
              <div className="pt-2 border-t border-border/50">
                <Badge variant="secondary" className="text-xs">
                  Member-only terms
                </Badge>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                Sign in to view member terms
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
