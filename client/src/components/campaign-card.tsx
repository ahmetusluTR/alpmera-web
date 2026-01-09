import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { getStatusLabel, getStatusColor } from "@/lib/campaign-status";

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
            <Badge className={`shrink-0 ${getStatusColor(campaign.state)}`} data-testid={`badge-state-${campaign.id}`}>
              {getStatusLabel(campaign.state)}
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
            
            <div className="pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                View campaign details
              </span>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  Sign in to join
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
