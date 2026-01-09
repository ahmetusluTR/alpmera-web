import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { CampaignCard } from "@/components/campaign-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, LayoutGrid, List } from "lucide-react";
import { Link } from "wouter";
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

type LayoutMode = "grid" | "list";

function getLayoutPreference(): LayoutMode {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("campaigns_layout");
    if (stored === "list" || stored === "grid") return stored;
  }
  return "grid";
}

function setLayoutPreference(mode: LayoutMode) {
  if (typeof window !== "undefined") {
    localStorage.setItem("campaigns_layout", mode);
  }
}

function CampaignListItem({ campaign }: { campaign: PublicCampaign }) {
  const { isAuthenticated } = useAuth();
  const progress = campaign.progressPercent || 0;

  return (
    <Link href={`/campaign/${campaign.id}`}>
      <Card 
        className="overflow-visible cursor-pointer hover-elevate active-elevate-2 transition-all duration-200 p-4"
        data-testid={`list-campaign-${campaign.id}`}
      >
        <div className="flex items-center gap-4">
          {campaign.imageUrl && (
            <div className="w-20 h-20 shrink-0 overflow-hidden rounded-md">
              <img 
                src={campaign.imageUrl} 
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-base leading-tight truncate">{campaign.title}</h3>
              <Badge className={`shrink-0 text-xs ${getStatusColor(campaign.state)}`}>
                {getStatusLabel(campaign.state)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="font-mono text-sm font-medium shrink-0">{progress}%</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">View campaign details</span>
              {!isAuthenticated && (
                <span className="text-xs text-muted-foreground italic ml-2">Sign in to join</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Campaigns() {
  const [layout, setLayout] = useState<LayoutMode>("grid");
  
  useEffect(() => {
    setLayout(getLayoutPreference());
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayout(mode);
    setLayoutPreference(mode);
  };

  const { data: campaigns, isLoading } = useQuery<PublicCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  return (
    <Layout>
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Campaigns</h1>
              <p className="text-muted-foreground">
                Browse all campaigns and their progress.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={layout === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => handleLayoutChange("grid")}
                data-testid="button-layout-grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={layout === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => handleLayoutChange("list")}
                data-testid="button-layout-list"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            layout === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-40 w-full mb-4 rounded-md" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-2 w-full mb-3" />
                    <Skeleton className="h-4 w-1/3" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-20 h-20 rounded-md" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-1/2 mb-2" />
                        <Skeleton className="h-2 w-full max-w-xs" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : campaigns && campaigns.length > 0 ? (
            layout === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="campaigns-grid">
                {campaigns.map((campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4" data-testid="campaigns-list">
                {campaigns.map((campaign) => (
                  <CampaignListItem 
                    key={campaign.id} 
                    campaign={campaign}
                  />
                ))}
              </div>
            )
          ) : (
            <Card className="p-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Campaigns</h3>
              <p className="text-muted-foreground">
                There are no campaigns available at this time. Check back later.
              </p>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
}
