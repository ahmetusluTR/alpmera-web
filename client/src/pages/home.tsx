import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { CampaignCard } from "@/components/campaign-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  FileCheck,
  HandCoins,
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  MapPin,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PublicCampaign {
  id: string;
  title: string;
  description: string;
  state: string;
  imageUrl?: string | null;
  progressPercent: number;
  aggregationDeadline: string;
}

interface PublicCampaignResponse {
  rows: PublicCampaign[];
  total: number;
  page: number;
  pageSize: number;
}

export default function Home() {
  const { toast } = useToast();
  const [earlyListEmail, setEarlyListEmail] = useState("");
  const [earlyListZipCode, setEarlyListZipCode] = useState("");
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productReason, setProductReason] = useState("");

  const { data: inProgressResponse, isLoading: inProgressLoading } = useQuery<PublicCampaignResponse>({
    queryKey: ["/api/campaigns", "in-progress"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "6",
        status: "AGGREGATION,SUCCESS",
        sort: "deadline_asc",
      });
      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: completedResponse } = useQuery<PublicCampaignResponse>({
    queryKey: ["/api/campaigns", "completed"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "3",
        status: "FULFILLMENT,RELEASED",
        sort: "created_desc",
      });
      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const earlyListMutation = useMutation({
    mutationFn: async (data: { email: string; zipCode: string }) => {
      const res = await fetch("/api/landing-subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          zipCode: data.zipCode,
          source: "homepage_hero",
          receiveUpdates: true,
          interestTags: ["early_access"],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to join early list");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to the early list!",
        description: "You'll be first to know when we launch campaigns in your area.",
      });
      setEarlyListEmail("");
      setEarlyListZipCode("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const productSuggestionMutation = useMutation({
    mutationFn: async (data: { productName: string; referenceUrl: string; reason: string }) => {
      const res = await fetch("/api/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit suggestion");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your suggestion!",
        description: "We'll review it and notify you if we launch a campaign.",
      });
      setProductName("");
      setProductUrl("");
      setProductReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEarlyListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyListEmail || !earlyListZipCode) {
      toast({
        title: "Missing information",
        description: "Please provide both email and zip code",
        variant: "destructive",
      });
      return;
    }
    earlyListMutation.mutate({ email: earlyListEmail, zipCode: earlyListZipCode });
  };

  const handleProductSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productUrl) {
      toast({
        title: "Missing information",
        description: "Please provide product name and URL",
        variant: "destructive",
      });
      return;
    }
    productSuggestionMutation.mutate({
      productName,
      referenceUrl: productUrl,
      reason: productReason || "",
    });
  };

  const inProgressCampaigns = inProgressResponse?.rows ?? [];
  const completedCampaigns = completedResponse?.rows ?? [];

  return (
    <Layout>
      {/* Hero Section - Trust Architecture */}
      <section className="relative py-20 px-6 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-slate-200 opacity-30" style={{
          backgroundImage: `linear-gradient(to right, rgb(226, 232, 240) 1px, transparent 1px),
                           linear-gradient(to bottom, rgb(226, 232, 240) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Message */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-mono text-amber-900">Beta Launch: Q2 2026 • Seattle Only</span>
              </div>

              <h1 className="text-5xl font-bold leading-tight tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Collective Buying<br/>
                <span className="text-blue-600">Built on Trust</span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed">
                Join campaigns to unlock better pricing through pooled demand. Your funds stay locked in regulated escrow until conditions are met. No pressure. No tricks. Just verified collective action.
              </p>

              {/* Mock Campaign Teaser */}
              <Card className="border-l-4 border-l-blue-500 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <Badge variant="secondary" className="mb-2">Example Campaign</Badge>
                      <h3 className="font-semibold text-lg">Organic Baby Formula Bundle</h3>
                      <p className="text-sm text-muted-foreground">Save 32% vs retail • Seattle delivery</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono font-semibold">127 / 200 participants</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{ width: '64%' }} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">8 days remaining</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Escrow-protected funds</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Full refund guarantee</span>
                </div>
              </div>
            </div>

            {/* Right: Early Access Form */}
            <Card className="shadow-2xl border-2 border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Join the Early List
                </CardTitle>
                <CardDescription>
                  Get priority access when we launch. First 100 members receive a <strong className="text-foreground">$10 campaign credit</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEarlyListSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="early-email">Email</Label>
                    <Input
                      id="early-email"
                      type="email"
                      placeholder="you@example.com"
                      value={earlyListEmail}
                      onChange={(e) => setEarlyListEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="early-zipcode">Zip Code</Label>
                    <Input
                      id="early-zipcode"
                      type="text"
                      placeholder="98101"
                      maxLength={5}
                      value={earlyListZipCode}
                      onChange={(e) => setEarlyListZipCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll notify you when campaigns launch in your area
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={earlyListMutation.isPending}
                  >
                    {earlyListMutation.isPending ? "Joining..." : "Get Priority Access"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Infrastructure Section */}
      <section className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Security & Compliance
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Your funds are protected by regulated financial infrastructure, not promises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 p-6 rounded-lg bg-slate-800/50 border border-slate-700">
              <Lock className="w-10 h-10 text-blue-400 mx-auto" />
              <h3 className="font-semibold text-lg">Regulated Escrow Partner</h3>
              <p className="text-sm text-slate-300">
                Funds held by US-regulated escrow provider. Details provided upon registration.
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-lg bg-slate-800/50 border border-slate-700">
              <Shield className="w-10 h-10 text-green-400 mx-auto" />
              <h3 className="font-semibold text-lg">Bank-Level Security</h3>
              <p className="text-sm text-slate-300">
                256-bit encryption, PCI compliance, and third-party security audits.
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-lg bg-slate-800/50 border border-slate-700">
              <FileCheck className="w-10 h-10 text-purple-400 mx-auto" />
              <h3 className="font-semibold text-lg">Transparent Conditions</h3>
              <p className="text-sm text-slate-300">
                Every campaign has explicit rules. Funds release only when conditions are met.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/how-it-works">
              <Button variant="outline" size="sm" className="text-white border-slate-600 hover:bg-slate-800">
                Read Full Trust Model
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Founder's Note */}
      <section className="py-16 px-6 bg-amber-50 border-y border-amber-100">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200 border border-amber-300">
              <span className="text-sm font-semibold text-amber-900">From the Founder</span>
            </div>

            <h2 className="text-2xl font-bold">Why I Built Alpmera</h2>

            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed">
                I watched flash sale sites create artificial urgency, subscription boxes lock people into unwanted commitments, and group-buy platforms collapse without refunding members. The pattern was clear: platforms optimized for their own revenue, not participant trust.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed">
                Alpmera is different by design. We're a coordination platform, not a retailer. Escrow protection is constitutional, not optional. Campaign rules are explicit, not hidden. We succeed only when participants get exactly what they committed to—no surprises, no trust debt.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed">
                This is collective buying rebuilt from first principles. Seattle is our proof-of-concept. If we get trust right here, we expand. If not, we stop.
              </p>
              <p className="text-base text-slate-600 italic">
                — Ahmet Uslu, Founder
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Suggestion Section - Prominent */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Shape Our First Campaigns</CardTitle>
              <CardDescription className="text-base">
                Suggest products you'd join a campaign for. Most-requested items become our beta campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSuggestion} className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    placeholder="e.g., Organic Baby Formula, Electric Toothbrush, Standing Desk"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-url">Product URL (Amazon, manufacturer site, etc.) *</Label>
                  <Input
                    id="product-url"
                    type="url"
                    placeholder="https://..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-reason">Why would you join a campaign for this?</Label>
                  <Textarea
                    id="product-reason"
                    placeholder="Optional: Share why this matters to you..."
                    value={productReason}
                    onChange={(e) => setProductReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={productSuggestionMutation.isPending}
                >
                  {productSuggestionMutation.isPending ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works - Condensed */}
      <section className="py-12 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HowItWorksStep
              icon={<FileCheck className="w-6 h-6" />}
              step="1"
              title="Review Rules"
              description="Each campaign has explicit conditions. Read them before committing."
            />
            <HowItWorksStep
              icon={<Lock className="w-6 h-6" />}
              step="2"
              title="Lock Funds"
              description="Funds go to escrow, not Alpmera. Protected until conditions are met."
            />
            <HowItWorksStep
              icon={<TrendingUp className="w-6 h-6" />}
              step="3"
              title="Target Reached"
              description="Campaign succeeds when participation threshold is met."
            />
            <HowItWorksStep
              icon={<HandCoins className="w-6 h-6" />}
              step="4"
              title="Fulfillment"
              description="Supplier delivers. Funds release only after confirmation."
            />
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      {inProgressCampaigns.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
              <h2 className="text-2xl font-semibold">Active Campaigns</h2>
              <Link href="/campaigns">
                <Button variant="ghost" size="sm">
                  View all campaigns
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground mb-8">
              Join these campaigns before their deadlines. Details visible to participants only.
            </p>

            {inProgressLoading ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {completedCampaigns.length > 0 && (
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-2">Recently Completed</h2>
            <p className="text-muted-foreground mb-8">
              These campaigns reached their targets and moved to fulfillment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ - Condensed with Accordion */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Common Questions
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Clear answers about how Alpmera works. <Link href="/faq" className="text-blue-600 hover:underline">View full FAQ →</Link>
          </p>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="item-1" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">
                What happens if a campaign doesn't reach its target?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                100% of your escrowed funds are automatically refunded to your original payment method. No fees, no delays. Failed campaigns cost you nothing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">
                Who holds my money during a campaign?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                A US-regulated escrow provider (details provided upon registration). Alpmera never touches participant funds. We only coordinate the campaign.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">
                Can I cancel my commitment after joining?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Before the campaign reaches its target: yes, full refund. After target is met and supplier accepts: no, your commitment is binding to protect the collective agreement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">
                Why Seattle only for beta launch?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We're testing our trust model with a concentrated geographic area first. If Seattle campaigns succeed with zero trust issues, we'll expand to other cities in Q3 2026.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">
                How do you make money if you're not the seller?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We charge suppliers a small coordination fee (typically 8-12% of campaign value). Participants pay the collective price with no markup. Our incentive aligns with successful, trust-preserving campaigns.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-8 text-center">
            <Link href="/faq">
              <Button variant="outline">
                View All Questions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Phase 1 Context Banner */}
      <section className="py-8 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MapPin className="w-5 h-5" />
            <h3 className="text-xl font-semibold">Phase 1: Seattle Proof-of-Concept</h3>
          </div>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Beta campaigns launching Q2 2026 for Seattle-area participants. Successful test leads to regional expansion in Q3 2026.
            Join the early list to participate in our first campaigns.
          </p>
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
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg border border-slate-200">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
        {icon}
      </div>
      <div className="text-xs font-bold text-blue-600 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        STEP {step}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
