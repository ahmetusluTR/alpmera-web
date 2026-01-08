import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Lock, FileCheck, Calculator, ClipboardCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Campaign } from "@shared/schema";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getIdempotencyKeyForCommitment(
  campaignId: string,
  email: string,
  quantity: number,
  unitPrice: string
): string {
  const fingerprint = `${campaignId}|${email.toLowerCase().trim()}|${quantity}|${unitPrice}`;
  const storageKey = `commit-idem-${fingerprint}`;
  
  const existingKey = sessionStorage.getItem(storageKey);
  if (existingKey) {
    return existingKey;
  }
  
  const newKey = generateUUID();
  sessionStorage.setItem(storageKey, newKey);
  return newKey;
}

interface CampaignWithStats extends Campaign {
  participantCount: number;
  totalCommitted: number;
}

const STEPS = [
  { id: 1, title: "Review Rules", icon: FileCheck },
  { id: 2, title: "Commitment Amount", icon: Calculator },
  { id: 3, title: "Review & Confirm", icon: ClipboardCheck },
  { id: 4, title: "Escrow Confirmation", icon: Lock },
];

export default function CommitmentWizard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, isProfileComplete } = useAuth();

  const [step, setStep] = useState(1);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [formData, setFormData] = useState({
    participantName: "",
    participantEmail: "",
    quantity: 1,
  });
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [wasIdempotent, setWasIdempotent] = useState(false);

  const { data: campaign, isLoading, error } = useQuery<CampaignWithStats>({
    queryKey: ["/api/campaigns", id],
    enabled: !!id,
  });

  useEffect(() => {
    if (user?.profile && !formData.participantName && !formData.participantEmail) {
      setFormData(prev => ({
        ...prev,
        participantName: user.profile?.fullName || prev.participantName,
        participantEmail: user.email || prev.participantEmail,
      }));
    }
  }, [user]);

  const commitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const idempotencyKey = getIdempotencyKeyForCommitment(
        id || "",
        data.participantEmail,
        data.quantity,
        campaign?.unitPrice || "0"
      );
      
      const response = await apiRequest(
        "POST",
        `/api/campaigns/${id}/commit`,
        {
          ...data,
          amount: (parseFloat(campaign?.unitPrice || "0") * data.quantity).toString(),
        },
        { "x-idempotency-key": idempotencyKey }
      );
      return response.json();
    },
    onSuccess: (data) => {
      const isIdempotent = data._idempotent === true;
      setWasIdempotent(isIdempotent);
      
      const refNum = data.referenceNumber || data.response?.referenceNumber;
      
      if (refNum) {
        setReferenceNumber(refNum);
        setStep(4);
        queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
      } else if (isIdempotent) {
        toast({
          title: "Commitment Already Recorded",
          description: "Your commitment was already confirmed. Please check your email for your reference number.",
        });
        navigate(`/campaign/${id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Commitment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The campaign you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>Return to Campaigns</Button>
        </div>
      </Layout>
    );
  }

  if (campaign.state !== "AGGREGATION") {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Commitments Closed</h1>
          <p className="text-muted-foreground mb-6">
            This campaign is no longer accepting new commitments.
          </p>
          <Button onClick={() => navigate(`/campaign/${id}`)}>View Campaign</Button>
        </div>
      </Layout>
    );
  }

  const unitPrice = parseFloat(campaign.unitPrice);
  const minCommitment = parseFloat(campaign.minCommitment);
  const maxCommitment = campaign.maxCommitment ? parseFloat(campaign.maxCommitment) : null;
  const totalAmount = unitPrice * formData.quantity;
  const minQuantity = Math.ceil(minCommitment / unitPrice);
  const maxQuantity = maxCommitment ? Math.floor(maxCommitment / unitPrice) : null;

  const isQuantityValid = formData.quantity >= minQuantity && (!maxQuantity || formData.quantity <= maxQuantity);
  const isFormValid = formData.participantName.trim() && formData.participantEmail.includes("@") && isQuantityValid;

  const handleNext = () => {
    if (step === 3) {
      if (!isAuthenticated || !isProfileComplete) {
        return;
      }
      commitMutation.mutate(formData);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(`/campaign/${id}`);
    } else {
      setStep(step - 1);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/campaign/${id}`)} data-testid="button-back-to-campaign">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </Button>
          </div>
          
          <h1 className="text-2xl font-semibold mb-2" data-testid="wizard-title">Make a Commitment</h1>
          <p className="text-muted-foreground">{campaign.title}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    step > s.id 
                      ? "bg-green-600 border-green-600 text-white"
                      : step === s.id
                      ? "bg-chart-1 border-chart-1 text-white"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                  data-testid={`wizard-step-${s.id}`}
                >
                  {step > s.id ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${step > s.id ? "bg-green-600" : "bg-muted-foreground/30"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            {STEPS.map((s) => (
              <span key={s.id} className={`text-xs font-medium ${step === s.id ? "text-foreground" : "text-muted-foreground"}`}>
                {s.title}
              </span>
            ))}
          </div>
        </div>

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-chart-1" />
                  Campaign Rules
                </CardTitle>
                <CardDescription>
                  Please read and accept the campaign rules before proceeding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-md p-4 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" data-testid="rules-content">
                    {campaign.rules}
                  </pre>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="accept-rules" 
                    checked={rulesAccepted}
                    onCheckedChange={(checked) => setRulesAccepted(checked === true)}
                    data-testid="checkbox-accept-rules"
                  />
                  <Label htmlFor="accept-rules" className="text-sm leading-relaxed cursor-pointer">
                    I have read and understood the campaign rules. I acknowledge that my funds will be locked in escrow 
                    until the campaign reaches its target or fails.
                  </Label>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleNext} disabled={!rulesAccepted} data-testid="button-next-step-1">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-chart-1" />
                  Commitment Amount
                </CardTitle>
                <CardDescription>
                  Enter your details and select the quantity you wish to commit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter your full name"
                      value={formData.participantName}
                      onChange={(e) => setFormData({ ...formData, participantName: e.target.value })}
                      data-testid="input-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.participantEmail}
                      onChange={(e) => setFormData({ ...formData, participantEmail: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span className="font-mono font-medium">{unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        id="quantity" 
                        type="number"
                        min={minQuantity}
                        max={maxQuantity || undefined}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        className="w-24 font-mono"
                        data-testid="input-quantity"
                      />
                      <span className="text-sm text-muted-foreground">
                        Min: {minQuantity}{maxQuantity ? `, Max: ${maxQuantity}` : ""}
                      </span>
                    </div>
                    {!isQuantityValid && formData.quantity > 0 && (
                      <p className="text-sm text-destructive">
                        Quantity must be between {minQuantity} and {maxQuantity || "unlimited"}
                      </p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Commitment</span>
                    <span className="text-xl font-mono font-semibold" data-testid="text-total-amount">
                      {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!isFormValid} data-testid="button-next-step-2">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-chart-1" />
                  Review & Confirm
                </CardTitle>
                <CardDescription>
                  Please review your commitment details before confirming.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Campaign</span>
                    <span className="font-medium" data-testid="review-campaign">{campaign.title}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="font-medium" data-testid="review-name">{formData.participantName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium" data-testid="review-email">{formData.participantEmail}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <span className="font-mono font-medium" data-testid="review-quantity">{formData.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unit Price</span>
                    <span className="font-mono font-medium">{unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Total to Lock in Escrow</span>
                    <span className="font-mono font-semibold" data-testid="review-total">
                      {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    By confirming, your funds will be locked in escrow. If the campaign fails to meet its target, 
                    your full commitment will be refunded. If successful, funds will be released upon fulfillment.
                  </p>
                </div>
                
                {!isAuthenticated && !authLoading && (
                  <div className="flex items-start gap-3 p-4 border border-border rounded-md bg-muted/30">
                    <User className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Sign in required</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        You must sign in to confirm your commitment. Your delivery profile is needed for fulfillment.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/signin?next=/campaign/${id}/commit`)}
                        data-testid="button-signin-gate"
                      >
                        Sign in to continue
                      </Button>
                    </div>
                  </div>
                )}
                
                {isAuthenticated && !isProfileComplete && (
                  <div className="flex items-start gap-3 p-4 border border-border rounded-md bg-muted/30">
                    <User className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Delivery profile required</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Please complete your delivery profile before confirming. This information is required for fulfillment.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate("/account")}
                        data-testid="button-complete-profile-gate"
                      >
                        Complete profile
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step-3">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={commitMutation.isPending || !isAuthenticated || !isProfileComplete} 
                    data-testid="button-confirm-commitment"
                  >
                    {commitMutation.isPending ? "Processing..." : "Confirm Commitment"}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && referenceNumber && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  Escrow Confirmation
                </CardTitle>
                <CardDescription>
                  Your commitment has been recorded and funds are locked in escrow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Commitment Confirmed</h3>
                  {wasIdempotent && (
                    <p className="text-muted-foreground text-xs mb-2" data-testid="text-idempotent-notice">
                      This commitment was already confirmed. Showing your existing reference.
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm mb-4">
                    Your reference number is:
                  </p>
                  <div className="bg-muted rounded-md px-4 py-3 inline-block">
                    <code className="font-mono text-lg font-medium" data-testid="text-reference-number">
                      {referenceNumber}
                    </code>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-md p-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Save this reference number. You can use it to check the status of your commitment at any time.
                  </p>
                  <p className="text-muted-foreground">
                    Your funds are now locked in escrow and will remain there until the campaign concludes.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button onClick={() => navigate(`/status?ref=${referenceNumber}`)} data-testid="button-check-status">
                    Check Commitment Status
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")} data-testid="button-return-home">
                    Return to Campaigns
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
