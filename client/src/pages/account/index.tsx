import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AccountLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  Package,
  Lock,
  Coins,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardData {
  summary: {
    activeCommitments: number;
    totalLockedInEscrow: string;
    availableCredits: string;
  };
  priorityItems?: {
    closingSoon: Array<{
      campaignId: string;
      title: string;
      daysUntilDeadline: number;
      deadline: string;
    }>;
    recentUpdates: Array<{
      campaignId: string;
      title: string;
      statusChange: string;
      timestamp: string;
    }>;
  };
  recentCommitments: Array<{
    id: string;
    referenceNumber: string;
    campaignId: string;
    campaignTitle: string;
    campaignImage: string | null;
    campaignState: string;
    commitmentStatus: string;
    amount: string;
    createdAt: string;
  }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCampaignStateBadge(state: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string } {
  switch (state) {
    case "AGGREGATION":
      return { label: "Aggregating", variant: "default", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "SUCCESS":
      return { label: "Target Reached", variant: "default", color: "bg-green-50 text-green-700 border-green-200" };
    case "FULFILLMENT":
      return { label: "Fulfilling", variant: "default", color: "bg-purple-50 text-purple-700 border-purple-200" };
    case "RELEASED":
      return { label: "Completed", variant: "outline", color: "bg-gray-50 text-gray-700 border-gray-300" };
    case "FAILED":
      return { label: "Failed", variant: "secondary", color: "bg-gray-100 text-gray-600 border-gray-300" };
    default:
      return { label: state, variant: "secondary", color: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}

function getCommitmentStatusBadge(status: string): { label: string; variant: "default" | "secondary" | "outline"; color: string } {
  switch (status) {
    case "LOCKED":
      return { label: "Locked", variant: "default", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "RELEASED":
      return { label: "Released", variant: "outline", color: "bg-green-50 text-green-700 border-green-200" };
    case "REFUNDED":
      return { label: "Refunded", variant: "secondary", color: "bg-gray-100 text-gray-600 border-gray-300" };
    default:
      return { label: status, variant: "secondary", color: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}

// ============================================================================
// SUMMARY CARDS COMPONENT
// ============================================================================

interface SummaryCardsProps {
  summary: DashboardData["summary"];
}

function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      icon: Package,
      label: "Active Commitments",
      value: summary.activeCommitments.toString(),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "campaigns joined"
    },
    {
      icon: Lock,
      label: "Locked in Escrow",
      value: `$${parseFloat(summary.totalLockedInEscrow).toFixed(2)}`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "secured funds"
    },
    {
      icon: Coins,
      label: "Available Credits",
      value: `$${parseFloat(summary.availableCredits).toFixed(2)}`,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "ready to use"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: index * 0.1
          }}
        >
          <Card className="border-2 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`${card.bgColor} p-3 rounded-lg shrink-0`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1 truncate">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// PRIORITY ATTENTION COMPONENT
// ============================================================================

interface PriorityAttentionProps {
  priorityItems: DashboardData["priorityItems"];
}

function PriorityAttention({ priorityItems }: PriorityAttentionProps) {
  if (!priorityItems || (priorityItems.closingSoon.length === 0 && priorityItems.recentUpdates.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
    >
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg text-gray-900">Needs Your Attention</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Campaigns Closing Soon */}
          {priorityItems.closingSoon.length > 0 && (
            <div className="space-y-2">
              {priorityItems.closingSoon.map((item) => (
                <Link key={item.campaignId} href={`/campaigns/${item.campaignId}`}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors cursor-pointer">
                    <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-orange-700">
                        Closes in {item.daysUntilDeadline} {item.daysUntilDeadline === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent Updates */}
          {priorityItems.recentUpdates.length > 0 && (
            <div className="space-y-2">
              {priorityItems.recentUpdates.map((item, index) => (
                <Link key={`${item.campaignId}-${index}`} href={`/campaigns/${item.campaignId}`}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer">
                    <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-blue-700">{item.statusChange}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// RECENT COMMITMENTS GRID
// ============================================================================

interface RecentCommitmentsProps {
  commitments: DashboardData["recentCommitments"];
}

function RecentCommitments({ commitments }: RecentCommitmentsProps) {
  if (commitments.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recent Commitments</h2>
        <Link href="/account/commitments">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commitments.slice(0, 6).map((commitment, index) => {
          const campaignBadge = getCampaignStateBadge(commitment.campaignState);
          const commitmentBadge = getCommitmentStatusBadge(commitment.commitmentStatus);

          return (
            <motion.div
              key={commitment.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.5 + index * 0.05
              }}
            >
              <Link href={`/account/commitments/${commitment.referenceNumber}`}>
                <Card className="border-2 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
                  <CardContent className="p-4 space-y-3">
                    {/* Campaign Image */}
                    {commitment.campaignImage && (
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={commitment.campaignImage}
                          alt={commitment.campaignTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Campaign Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {commitment.campaignTitle}
                    </h3>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`text-xs border ${commitmentBadge.color}`}>
                        {commitmentBadge.label}
                      </Badge>
                      <Badge className={`text-xs border ${campaignBadge.color}`}>
                        {campaignBadge.label}
                      </Badge>
                    </div>

                    {/* Amount & Date */}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-semibold text-gray-900">
                          ${parseFloat(commitment.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Joined</span>
                        <span className="text-gray-600">
                          {format(new Date(commitment.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Reference Number */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-0.5">Reference</p>
                      <p className="text-xs font-mono text-gray-700">{commitment.referenceNumber}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
    >
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="py-16 px-6 text-center">
          <div className="max-w-md mx-auto space-y-6">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-blue-500" />
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900">No Active Commitments</h3>
              <p className="text-gray-600 leading-relaxed">
                You haven't joined any campaigns yet. Browse available campaigns to start
                participating in collective buying opportunities.
              </p>
            </div>

            {/* Trust Signal */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-900 leading-relaxed">
                  <strong>Reminder:</strong> All commitments are secured in escrow. Your funds are
                  protected until campaign conditions are met.
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link href="/campaigns">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                Browse Campaigns
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// QUICK ACTIONS FOOTER
// ============================================================================

function QuickActions() {
  const actions = [
    {
      href: "/account/commitments",
      icon: Package,
      label: "View All Commitments",
      description: "See complete history"
    },
    {
      href: "/campaigns",
      icon: TrendingUp,
      label: "Browse Campaigns",
      description: "Discover new opportunities"
    },
    {
      href: "/account/credits",
      icon: Coins,
      label: "Check Credits",
      description: "View your balance"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="border-2 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <action.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </motion.div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Commitments Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="w-full h-32 rounded-lg" />
                <Skeleton className="h-5 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AccountDashboard() {
  const { isAuthenticated, user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/account/dashboard"],
    enabled: isAuthenticated,
  });

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back{user?.profile?.name ? `, ${user.profile.name}` : ""}
          </h1>
          <p className="text-gray-600 mt-1">Here's an overview of your commitments and activity</p>
        </motion.div>

        {/* Loading State */}
        {isLoading && <DashboardSkeleton />}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-6 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-4">Please try again in a moment</p>
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dashboard Content */}
        {data && (
          <>
            {/* Summary Cards */}
            <SummaryCards summary={data.summary} />

            {/* Priority Attention (conditional) */}
            {data.priorityItems && <PriorityAttention priorityItems={data.priorityItems} />}

            {/* Recent Commitments or Empty State */}
            {data.recentCommitments.length > 0 ? (
              <RecentCommitments commitments={data.recentCommitments} />
            ) : (
              <EmptyState />
            )}

            {/* Quick Actions Footer */}
            <QuickActions />
          </>
        )}
      </div>
    </AccountLayout>
  );
}
