import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, FileCheck, HandCoins, Users, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold mb-4" data-testid="how-it-works-title">How Alpmera Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A trust-first approach to collective buying. No pressure, no urgency, just transparent commitments.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">The Doctrine</h2>
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-chart-1 shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-2">Trust Over Speed</h3>
                  <p className="text-muted-foreground">
                    Alpmera prioritizes correctness and auditability over conversion optimization. 
                    We don't use countdown timers, urgency messaging, or growth hacks. Every transaction 
                    is recorded in an append-only ledger for complete transparency.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 text-chart-1 shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-2">Escrow-Style Commitments</h3>
                  <p className="text-muted-foreground">
                    When you commit to a campaign, your funds are locked - not spent. They remain in 
                    escrow until the campaign succeeds and the supplier fulfills their obligations. 
                    If the campaign fails, you receive a full refund.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-chart-1 shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-2">Collective Action</h3>
                  <p className="text-muted-foreground">
                    Campaigns succeed through collective commitment. Multiple participants pool their 
                    commitments to reach a target that enables bulk purchasing at better terms. 
                    Individual buyers gain the power of collective negotiation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Campaign Lifecycle</h2>
          <div className="space-y-4">
            <LifecycleStep 
              number="1"
              title="AGGREGATION"
              status="active"
              description="The campaign is open for commitments. Participants review the rules, understand the terms, and lock their funds in escrow. The campaign runs until it reaches its target or the deadline passes."
            />
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LifecycleStep 
                number="2a"
                title="SUCCESS"
                status="success"
                description="The target was met. The supplier is notified and has the opportunity to accept the aggregated commitment. Funds remain locked pending fulfillment."
              />
              <LifecycleStep 
                number="2b"
                title="FAILED"
                status="failed"
                description="The target was not met by the deadline. All locked funds are automatically refunded to participants. The campaign is permanently closed."
              />
            </div>
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>
            <LifecycleStep 
              number="3"
              title="FULFILLMENT"
              status="active"
              description="The supplier has accepted and is fulfilling the commitment. Participants receive their goods. Funds remain locked until fulfillment is confirmed."
            />
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>
            <LifecycleStep 
              number="4"
              title="RELEASED"
              status="success"
              description="Fulfillment is complete. Locked funds are released to the supplier. The campaign is successfully concluded. All records remain in the immutable ledger."
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Your Protections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium mb-2">Automatic Refunds</h3>
                <p className="text-sm text-muted-foreground">
                  If a campaign fails to meet its target, your full commitment is refunded automatically. 
                  No questions asked, no manual processes.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
                  <FileCheck className="w-5 h-5 text-chart-1" />
                </div>
                <h3 className="font-medium mb-2">Append-Only Ledger</h3>
                <p className="text-sm text-muted-foreground">
                  Every fund movement is recorded in an append-only ledger. No entries can be deleted 
                  or modified, ensuring complete auditability.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-medium mb-2">No Urgency Tactics</h3>
                <p className="text-sm text-muted-foreground">
                  We don't use countdown timers, limited-time offers, or scarcity messaging. 
                  Take your time to read the rules and make an informed decision.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4">
                  <HandCoins className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Release After Fulfillment</h3>
                <p className="text-sm text-muted-foreground">
                  Funds are only released to suppliers after they have fulfilled their obligations. 
                  This protects you from non-delivery.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function LifecycleStep({ 
  number, 
  title, 
  status, 
  description 
}: { 
  number: string; 
  title: string; 
  status: "active" | "success" | "failed";
  description: string;
}) {
  const bgColor = status === "success" 
    ? "bg-green-600/10 border-green-600/20" 
    : status === "failed" 
    ? "bg-destructive/10 border-destructive/20"
    : "bg-card border-border";
  
  const iconColor = status === "success"
    ? "text-green-600"
    : status === "failed"
    ? "text-destructive"
    : "text-chart-1";

  return (
    <div className={`p-6 rounded-lg border ${bgColor}`} data-testid={`lifecycle-step-${number}`}>
      <div className="flex items-start gap-4">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${iconColor} border-current`}>
          <span className="text-sm font-semibold">{number}</span>
        </div>
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
