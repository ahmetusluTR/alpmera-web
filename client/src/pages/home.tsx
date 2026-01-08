import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { CampaignCard } from "@/components/campaign-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Lock, FileCheck, HandCoins } from "lucide-react";

interface PublicCampaign {
  id: string;
  title: string;
  description: string;
  state: string;
  imageUrl?: string | null;
  progressPercent: number;
  aggregationDeadline: string;
}

export default function Home() {
  const { data: campaigns, isLoading } = useQuery<PublicCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  return (
    <Layout>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight mb-6" data-testid="hero-title">
            Trust-First Collective Buying
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto" data-testid="hero-description">
            Alpmera is not a marketplace. It is a platform where communities form commitments 
            to participate together. Your funds are locked in escrow until campaign conditions are 
            met. No pressure. No urgency. Just verified collective action.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HowItWorksStep 
              icon={<FileCheck className="w-6 h-6" />}
              step="1"
              title="Review Rules"
              description="Each campaign has explicit rules. Read and understand them before committing."
            />
            <HowItWorksStep 
              icon={<Lock className="w-6 h-6" />}
              step="2"
              title="Lock Funds"
              description="Your commitment is locked in escrow. Funds are not spent - they are held securely."
            />
            <HowItWorksStep 
              icon={<Shield className="w-6 h-6" />}
              step="3"
              title="Wait for Target"
              description="Campaigns succeed when targets are met. If failed, all funds are refunded."
            />
            <HowItWorksStep 
              icon={<HandCoins className="w-6 h-6" />}
              step="4"
              title="Fulfillment"
              description="Upon success, suppliers fulfill orders. Funds release only after delivery."
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8">Active Campaigns</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-40 w-full mb-4 rounded-md" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-2 w-full mb-3" />
                  <Skeleton className="h-4 w-1/3" />
                </Card>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="campaigns-grid">
              {campaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Campaigns</h3>
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

function HowItWorksStep({ 
  icon, 
  step, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  step: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6" data-testid={`step-${step}`}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <div className="text-xs font-medium text-muted-foreground mb-2">STEP {step}</div>
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
