import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Users,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Package,
  RefreshCcw,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { format, addDays } from "date-fns";
import type { Campaign } from "@shared/schema";

// ============================================================================
// TYPES & UTILITIES
// ============================================================================

interface CampaignWithStats extends Campaign {
  participantCount: number;
  totalCommitted: number;
}

interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  selectedQuantity: number;
  selectedTier: string;
  userUnderstanding: {
    step2Viewed: boolean;
    step3Viewed: boolean;
    step4Viewed: boolean;
    confirmationChecked: boolean;
  };
  hasCommittedBefore: boolean;
}

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

function getIdempotencyKey(campaignId: string, email: string, quantity: number, unitPrice: string): string {
  const fingerprint = `${campaignId}|${email.toLowerCase().trim()}|${quantity}|${unitPrice}`;
  const storageKey = `commit-idem-${fingerprint}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const newKey = generateUUID();
  sessionStorage.setItem(storageKey, newKey);
  return newKey;
}

// ============================================================================
// PROGRESS INDICATOR COMPONENT
// ============================================================================

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const steps = [
    { num: 1, label: "What You're Joining" },
    { num: 2, label: "How It Works" },
    { num: 3, label: "Money's Journey" },
    { num: 4, label: "What Happens Next" },
    { num: 5, label: "Confirm" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: step.num <= currentStep ? "#3b82f6" : "#e5e7eb",
                  scale: step.num === currentStep ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-10 h-10 rounded-full flex items-center justify-center relative"
              >
                {step.num < currentStep ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <span className={`text-sm font-semibold ${step.num <= currentStep ? "text-white" : "text-gray-500"}`}>
                    {step.num}
                  </span>
                )}
              </motion.div>
              <span className="text-xs mt-2 text-center font-medium text-gray-600 hidden sm:block max-w-[80px]">
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 bg-gray-200 relative overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: step.num < currentStep ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute inset-y-0 left-0 bg-blue-500"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: WHAT YOU'RE JOINING
// ============================================================================

interface Step1Props {
  campaign: CampaignWithStats;
  quantity: number;
  onQuantityChange: (q: number) => void;
}

function Step1_WhatYoureJoining({ campaign, quantity, onQuantityChange }: Step1Props) {
  const unitPrice = parseFloat(campaign.unitPrice);
  const total = unitPrice * quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">What You're Joining</h2>
        <p className="text-gray-600">This campaign is organizing collective participation for a specific product</p>
      </div>

      {/* Product Card */}
      <Card className="overflow-hidden border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex gap-6 flex-col md:flex-row">
            {campaign.imageUrl && (
              <div className="w-full md:w-48 h-48 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{campaign.title}</h3>
                  <Badge variant="secondary" className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200">
                    Conditional Offer
                  </Badge>
                </div>
                <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
              </div>

              {/* Key Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Deadline</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(campaign.aggregationDeadline), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Target Threshold</div>
                    <div className="text-sm text-gray-600">{campaign.minParticipants} participants needed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quantity Selector */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6">
          <Label htmlFor="quantity" className="text-base font-semibold text-gray-900 mb-4 block">
            Select Quantity
          </Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-12 w-12 border-2"
            >
              -
            </Button>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-center text-xl font-semibold h-12 w-24 border-2"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(quantity + 1)}
              className="h-12 w-12 border-2"
            >
              +
            </Button>
            <div className="ml-auto text-right">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</div>
              <div className="text-xs text-gray-500">${unitPrice.toFixed(2)} × {quantity}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Signal */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Shield className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-900">
          Your funds are protected by escrow until campaign conditions are met
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 2: HOW IT WORKS (COLLECTIVE BUYING ANIMATION)
// ============================================================================

interface Step2Props {
  campaign: CampaignWithStats;
  onViewed: () => void;
}

function Step2_HowItWorks({ campaign, onViewed }: Step2Props) {
  const [animationStage, setAnimationStage] = useState(0);
  const progress = (campaign.participantCount / campaign.minParticipants) * 100;

  useEffect(() => {
    // Auto-advance animation stages
    const timers = [
      setTimeout(() => setAnimationStage(1), 1000),
      setTimeout(() => setAnimationStage(2), 2500),
      setTimeout(() => setAnimationStage(3), 4000),
      setTimeout(() => {
        setAnimationStage(4);
        onViewed(); // Mark as viewed
      }, 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onViewed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">How Collective Buying Works</h2>
        <p className="text-gray-600">This campaign aggregates individual commitments into one large group</p>
      </div>

      {/* Animation Canvas */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 min-h-[400px] border-2 border-gray-200">
        {/* Stage 1: Individual Participants */}
        <AnimatePresence>
          {animationStage >= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-12 left-8 space-y-3"
            >
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                  className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm border"
                >
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Participant {i}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 2: Aggregation Pool */}
        <AnimatePresence>
          {animationStage >= 2 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-blue-500 text-white p-6 rounded-xl shadow-lg text-center min-w-[200px]">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold text-lg">Group Pool</div>
                <div className="text-sm opacity-90">{campaign.participantCount} committed</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 3: Threshold Check */}
        <AnimatePresence>
          {animationStage >= 3 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-12 right-8"
            >
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-green-500">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-center">Threshold Reached</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 4: Success / Failure Paths */}
        <AnimatePresence>
          {animationStage >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4"
            >
              <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg text-center">
                <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-green-900">Campaign Succeeds</div>
                <div className="text-xs text-green-700">Supplier fulfills</div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-500 p-4 rounded-lg text-center">
                <RefreshCcw className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-orange-900">Campaign Fails</div>
                <div className="text-xs text-orange-700">Full refund</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Campaign Progress</span>
            <span className="text-sm font-semibold text-blue-600">{campaign.participantCount} / {campaign.minParticipants}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {progress < 100
              ? `${Math.ceil(campaign.minParticipants - campaign.participantCount)} more participants needed`
              : "Threshold reached! Campaign can proceed"}
          </p>
        </CardContent>
      </Card>

      {/* Key Point */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>Key Point:</strong> If the campaign doesn't reach the minimum threshold by the deadline,
          you receive a <strong>full automatic refund</strong>. No questions asked.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 3: YOUR MONEY'S JOURNEY (ESCROW TIMELINE)
// ============================================================================

interface Step3Props {
  amount: number;
  onViewed: () => void;
}

function Step3_MoneyJourney({ amount, onViewed }: Step3Props) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveStage(1), 800),
      setTimeout(() => setActiveStage(2), 1800),
      setTimeout(() => setActiveStage(3), 2800),
      setTimeout(() => {
        setActiveStage(4);
        onViewed();
      }, 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onViewed]);

  const stages = [
    {
      id: 1,
      icon: Lock,
      title: "Lock",
      description: "Your ${amount} is held in escrow",
      detail: "Funds are frozen - you can't spend them, but neither can Alpmera"
    },
    {
      id: 2,
      icon: Clock,
      title: "Hold",
      description: "Campaign reaches threshold",
      detail: "Supplier reviews and decides whether to accept"
    },
    {
      id: 3,
      icon: Package,
      title: "Release",
      description: "Supplier ships product",
      detail: "Funds transfer from escrow to supplier"
    },
    {
      id: 4,
      icon: RefreshCcw,
      title: "Or Refund",
      description: "Campaign fails or cancels",
      detail: "Funds automatically return to you"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Money's Journey</h2>
        <p className="text-gray-600">Explicit escrow flow - no hidden steps or surprise charges</p>
      </div>

      {/* Escrow Provider Badge */}
      <div className="flex justify-center mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-lg px-6 py-3 flex items-center gap-3 shadow-sm">
          <Shield className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <div className="text-xs text-gray-600">Secured by</div>
            <div className="font-semibold text-gray-900">US-Regulated Escrow Partner</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative max-w-2xl mx-auto">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: activeStage >= stage.id ? 1 : 0.3,
              x: 0
            }}
            transition={{ delay: index * 0.2 }}
            className="relative flex gap-4 mb-8 last:mb-0"
          >
            {/* Timeline Line */}
            {index < stages.length - 1 && (
              <div className="absolute left-[23px] top-12 w-0.5 h-[calc(100%+2rem)] bg-gray-300">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: activeStage > stage.id ? "100%" : 0 }}
                  className="w-full bg-blue-500"
                />
              </div>
            )}

            {/* Icon Circle */}
            <motion.div
              animate={{
                backgroundColor: activeStage >= stage.id ? "#3b82f6" : "#e5e7eb",
                scale: activeStage === stage.id ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative z-10"
            >
              <stage.icon className={`w-6 h-6 ${activeStage >= stage.id ? "text-white" : "text-gray-500"}`} />
            </motion.div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{stage.title}</h3>
              <p className="text-gray-700 mb-1">{stage.description}</p>
              <p className="text-sm text-gray-600">{stage.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Signal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>Important:</strong> Alpmera never touches your money. The escrow provider is an independent
          third party that holds funds securely until release conditions are met.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 4: WHAT HAPPENS NEXT (TIMELINE)
// ============================================================================

interface Step4Props {
  campaign: CampaignWithStats;
  onViewed: () => void;
}

function Step4_WhatHappensNext({ campaign, onViewed }: Step4Props) {
  useEffect(() => {
    const timer = setTimeout(onViewed, 2000);
    return () => clearTimeout(timer);
  }, [onViewed]);

  const deadlineDate = new Date(campaign.aggregationDeadline);
  const today = new Date();
  const resultsDate = addDays(deadlineDate, 2);

  const milestones = [
    {
      date: format(today, "MMM d, yyyy"),
      title: "Today - Funds Locked",
      description: "Your commitment is recorded and funds are held in escrow",
      status: "current"
    },
    {
      date: format(deadlineDate, "MMM d, yyyy"),
      title: "Campaign Deadline",
      description: "No more participants can join after this date",
      status: "future"
    },
    {
      date: format(resultsDate, "MMM d, yyyy"),
      title: "Results Announced",
      description: "Within 48 hours, you'll know if the campaign succeeded or failed",
      status: "future"
    },
    {
      date: "TBD",
      title: "Delivery or Refund",
      description: campaign.deliveryEstimate
        ? `If successful: ${campaign.deliveryEstimate}`
        : "If successful: Delivery date will be confirmed. If failed: Automatic refund",
      status: "future"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">What Happens Next</h2>
        <p className="text-gray-600">Clear timeline - no surprises or hidden steps</p>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl mx-auto space-y-6">
        {milestones.map((milestone, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`flex gap-4 p-4 rounded-lg border-2 ${
              milestone.status === "current"
                ? "bg-blue-50 border-blue-300"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="shrink-0 pt-1">
              <div className={`w-3 h-3 rounded-full ${
                milestone.status === "current" ? "bg-blue-500" : "bg-gray-300"
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-600">{milestone.date}</span>
                {milestone.status === "current" && (
                  <Badge variant="secondary" className="bg-blue-500 text-white text-xs">Current</Badge>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{milestone.title}</h3>
              <p className="text-sm text-gray-700">{milestone.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Communication Promise */}
      <Card className="border-2 border-gray-200 mt-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">No Silent Transitions</h3>
              <p className="text-sm text-gray-700 mb-3">
                You'll receive email notifications at every state change. You can also track
                real-time status in your <strong>/account/commitments</strong> dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Campaign closes</Badge>
                <Badge variant="outline" className="text-xs">Results announced</Badge>
                <Badge variant="outline" className="text-xs">Supplier ships</Badge>
                <Badge variant="outline" className="text-xs">Refund processed</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Signal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>Transparency Guarantee:</strong> Every status update is logged and visible in your account.
          No hidden states or surprise transitions.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 5: CONFIRM (SUMMARY + ACKNOWLEDGMENT)
// ============================================================================

interface Step5Props {
  campaign: CampaignWithStats;
  quantity: number;
  amount: number;
  onCheckboxChange: (checked: boolean) => void;
  acknowledged: boolean;
}

function Step5_Confirm({ campaign, quantity, amount, onCheckboxChange, acknowledged }: Step5Props) {
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [escrowAcknowledged, setEscrowAcknowledged] = useState(false);

  useEffect(() => {
    onCheckboxChange(riskAcknowledged && escrowAcknowledged);
  }, [riskAcknowledged, escrowAcknowledged, onCheckboxChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-gray-600">Please review all details before locking your commitment</p>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6 space-y-6">
          {/* Campaign Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Campaign Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Campaign</span>
                <span className="font-medium text-gray-900">{campaign.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium text-gray-900">{quantity} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unit Price</span>
                <span className="font-medium text-gray-900">${parseFloat(campaign.unitPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Escrow Amount</span>
                <span className="font-bold text-lg text-gray-900">${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Key Conditions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Key Conditions</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">
                  Deadline: <strong>{format(new Date(campaign.aggregationDeadline), "MMM d, yyyy")}</strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">
                  Threshold: <strong>{campaign.minParticipants} participants</strong> required
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">
                  Escrow: Held by <strong>US-regulated partner</strong>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Acknowledgments */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Required Acknowledgments</h3>
              <p className="text-sm text-gray-700 mb-4">
                Please read and confirm you understand these conditions:
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Checkbox 1: Escrow Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={escrowAcknowledged}
                onCheckedChange={(checked) => setEscrowAcknowledged(checked === true)}
                className="mt-1"
              />
              <span className="text-sm text-gray-800 leading-relaxed group-hover:text-gray-900">
                I understand my <strong>${amount.toFixed(2)}</strong> will be held in escrow until{" "}
                <strong>{format(new Date(campaign.aggregationDeadline), "MMM d, yyyy")}</strong>, and
                released only if the campaign succeeds and the supplier accepts.
              </span>
            </label>

            {/* Checkbox 2: Risk Acknowledgment */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={riskAcknowledged}
                onCheckedChange={(checked) => setRiskAcknowledged(checked === true)}
                className="mt-1"
              />
              <span className="text-sm text-gray-800 leading-relaxed group-hover:text-gray-900">
                I understand this campaign <strong>may not succeed</strong>, and if it fails to reach the
                minimum threshold or is cancelled, I will receive a <strong>full automatic refund</strong>.
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Final Trust Signal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Your Protection:</strong> Funds are held in an independent escrow account. Alpmera cannot
            access your money until all conditions are met. If conditions fail, refunds are automatic.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export default function CommitmentWizard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isProfileComplete, refetch: refetchAuth } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [quantity, setQuantity] = useState(1);
  const [understanding, setUnderstanding] = useState({
    step2Viewed: false,
    step3Viewed: false,
    step4Viewed: false,
    confirmationChecked: false,
  });
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const { data: campaign, isLoading, error } = useQuery<CampaignWithStats>({
    queryKey: ["/api/campaigns", id],
    enabled: !!id,
  });

  const { data: commitmentHistory } = useQuery({
    queryKey: ["/api/account/commitments"],
    enabled: isAuthenticated,
  });

  const hasCommittedBefore = useMemo(() => {
    return Array.isArray(commitmentHistory) && commitmentHistory.length > 0;
  }, [commitmentHistory]);

  useEffect(() => {
    refetchAuth();
  }, [refetchAuth]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate(`/auth/sign-in?returnTo=/campaigns/${id}/commit`);
    }
  }, [isAuthenticated, isLoading, navigate, id]);

  useEffect(() => {
    if (isAuthenticated && !isProfileComplete) {
      navigate(`/account/profile?returnTo=/campaigns/${id}/commit?step=${step}`);
    }
  }, [isAuthenticated, isProfileComplete, navigate, id, step]);

  const commitMutation = useMutation({
    mutationFn: async (data: { quantity: number; idempotencyKey: string }) => {
      return await apiRequest("POST", `/api/campaigns/${id}/commit`, data);
    },
    onSuccess: (response: any) => {
      setReferenceNumber(response.referenceNumber);
      toast({
        title: "Commitment Successful",
        description: `Reference: ${response.referenceNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/account/commitments"] });
      setTimeout(() => {
        navigate("/account/commitments");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Commitment Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated || !isProfileComplete) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Campaign Not Found</h2>
          <Button onClick={() => navigate("/campaigns")} className="mt-4">
            Browse Campaigns
          </Button>
        </div>
      </Layout>
    );
  }

  if (referenceNumber) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Commitment Locked in Escrow</h2>
            <p className="text-gray-600 mb-6">
              Your funds are now held securely. You'll receive updates at every state change.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Reference Number</div>
              <div className="text-2xl font-mono font-bold text-gray-900">{referenceNumber}</div>
            </div>
            <Button onClick={() => navigate("/account/commitments")} size="lg">
              View My Commitments
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const amount = parseFloat(campaign.unitPrice) * quantity;
  const canProceedToNext = () => {
    if (step === 2 && !understanding.step2Viewed) return false;
    if (step === 3 && !understanding.step3Viewed) return false;
    if (step === 4 && !understanding.step4Viewed) return false;
    if (step === 5 && !understanding.confirmationChecked) return false;
    return true;
  };

  const handleNext = () => {
    if (step < 5 && canProceedToNext()) {
      setStep((s) => (s + 1) as typeof step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as typeof step);
    }
  };

  const handleSubmit = () => {
    if (!user?.email) return;
    const idempotencyKey = getIdempotencyKey(campaign.id, user.email, quantity, campaign.unitPrice);
    commitMutation.mutate({ quantity, idempotencyKey });
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Skip Option for Returning Users */}
        {hasCommittedBefore && step < 5 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-900">You've done this before</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(5);
                  setUnderstanding({
                    step2Viewed: true,
                    step3Viewed: true,
                    step4Viewed: true,
                    confirmationChecked: false,
                  });
                }}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Skip to Confirmation
              </Button>
            </div>
          </motion.div>
        )}

        <WizardProgress currentStep={step} totalSteps={5} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1_WhatYoureJoining
              campaign={campaign}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          )}
          {step === 2 && (
            <Step2_HowItWorks
              campaign={campaign}
              onViewed={() => setUnderstanding((u) => ({ ...u, step2Viewed: true }))}
            />
          )}
          {step === 3 && (
            <Step3_MoneyJourney
              amount={amount}
              onViewed={() => setUnderstanding((u) => ({ ...u, step3Viewed: true }))}
            />
          )}
          {step === 4 && (
            <Step4_WhatHappensNext
              campaign={campaign}
              onViewed={() => setUnderstanding((u) => ({ ...u, step4Viewed: true }))}
            />
          )}
          {step === 5 && (
            <Step5_Confirm
              campaign={campaign}
              quantity={quantity}
              amount={amount}
              acknowledged={understanding.confirmationChecked}
              onCheckboxChange={(checked) =>
                setUnderstanding((u) => ({ ...u, confirmationChecked: checked }))
              }
            />
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-8 pt-6 border-t"
        >
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="min-w-[120px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-sm text-gray-600">
            Step {step} of 5
          </div>

          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!understanding.confirmationChecked || commitMutation.isPending}
              className="min-w-[180px] bg-blue-600 hover:bg-blue-700"
            >
              {commitMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Lock ${amount.toFixed(2)} in Escrow
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
