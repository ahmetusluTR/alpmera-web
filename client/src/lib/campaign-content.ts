export interface Protection {
  id: string;
  title: string;
  description: string;
  icon: "lock" | "shield" | "file";
}

export const CAMPAIGN_PROTECTIONS: Protection[] = [
  {
    id: "locked",
    title: "Your money is protected",
    description: "Funds stay locked while campaign is active; only released if campaign is accepted for execution.",
    icon: "lock",
  },
  {
    id: "refund",
    title: "Full refund if it doesn't go through",
    description: "If the campaign isn't accepted or doesn't complete, your commitment is fully refunded.",
    icon: "shield",
  },
  {
    id: "transparency",
    title: "No silent changes",
    description: "Key changes can't happen silently; important updates are recorded and visible.",
    icon: "file",
  },
];

export function getMomentumBucket(progressPercent: number): {
  label: string;
  emphasis: "low" | "medium" | "high" | "complete";
} {
  if (progressPercent >= 100) {
    return { label: "Goal reached", emphasis: "complete" };
  }
  if (progressPercent >= 75) {
    return { label: "Strong momentum", emphasis: "high" };
  }
  if (progressPercent >= 25) {
    return { label: "Building", emphasis: "medium" };
  }
  return { label: "Just started", emphasis: "low" };
}

export function getStatusExplainer(state: string): string | null {
  switch (state) {
    case "AGGREGATION":
      return "Commitments collected until goal reached or deadline ends.";
    case "SUCCESS":
      return "Goal reached. Awaiting supplier acceptance.";
    case "FULFILLMENT":
      return "Campaign accepted. Orders being fulfilled.";
    case "RELEASED":
      return "Campaign completed. Funds released to supplier.";
    case "FAILED":
      return "Campaign did not reach its goal. Funds refunded.";
    default:
      return null;
  }
}

export interface TimelineMilestone {
  id: string;
  label: string;
  isPending: boolean;
  date?: string;
  isFailed?: boolean;
  isComplete?: boolean;
}

export function getTimelineMilestones(
  state: string,
  createdAt: string,
  deadline: string,
  formatDate: (date: string) => string
): TimelineMilestone[] {
  const milestones: TimelineMilestone[] = [
    {
      id: "opened",
      label: "Campaign opened",
      isPending: false,
      date: formatDate(createdAt),
    },
  ];

  const isAggregation = state === "AGGREGATION";
  const isSuccess = state === "SUCCESS";
  const isFulfillment = state === "FULFILLMENT";
  const isReleased = state === "RELEASED";
  const isFailed = state === "FAILED";

  if (isFailed) {
    milestones.push({
      id: "failed",
      label: "Campaign did not reach goal",
      isPending: false,
      date: formatDate(deadline),
      isFailed: true,
    });
  } else {
    milestones.push({
      id: "goal",
      label: "Goal reached",
      isPending: isAggregation,
      date: isSuccess || isFulfillment || isReleased ? undefined : undefined,
      isComplete: isSuccess || isFulfillment || isReleased,
    });

    milestones.push({
      id: "accepted",
      label: "Supplier accepted",
      isPending: isAggregation || isSuccess,
      isComplete: isFulfillment || isReleased,
    });

    milestones.push({
      id: "execution",
      label: "In execution",
      isPending: isAggregation || isSuccess,
      isComplete: isFulfillment || isReleased,
    });

    milestones.push({
      id: "completed",
      label: "Completed",
      isPending: isAggregation || isSuccess || isFulfillment,
      isComplete: isReleased,
    });
  }

  return milestones;
}
