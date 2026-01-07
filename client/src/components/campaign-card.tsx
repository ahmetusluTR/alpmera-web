import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface CampaignCardProps {
  campaign: Campaign;
  participantCount?: number;
  totalCommitted?: number;
}

const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-chart-1 text-white",
  SUCCESS: "bg-green-600 dark:bg-green-700 text-white",
  FAILED: "bg-destructive text-destructive-foreground",
  FULFILLMENT: "bg-amber-600 dark:bg-amber-700 text-white",
  RELEASED: "bg-green-700 dark:bg-green-800 text-white",
};

export function CampaignCard({ campaign, participantCount = 0, totalCommitted = 0 }: CampaignCardProps) {
  const targetAmount = parseFloat(campaign.targetAmount);
  const progress = targetAmount > 0 ? Math.min((totalCommitted / targetAmount) * 100, 100) : 0;

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
              <span className="text-muted-foreground">Funding Progress</span>
              <span className="font-mono font-medium" data-testid={`text-progress-${campaign.id}`}>
                {totalCommitted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} / {targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span data-testid={`text-participants-${campaign.id}`}>{participantCount} participants</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
