import { Check, Circle, Clock } from "lucide-react";
import type { CampaignState } from "@shared/schema";

interface StateTimelineProps {
  currentState: CampaignState;
  isFailed?: boolean;
}

const STATES: CampaignState[] = ["AGGREGATION", "SUCCESS", "PROCUREMENT", "FULFILLMENT", "COMPLETED"];

const STATE_LABELS: Record<CampaignState, string> = {
  AGGREGATION: "Gathering commitments",
  SUCCESS: "Goal reached",
  PROCUREMENT: "Order placement",
  FAILED: "Not completed",
  FULFILLMENT: "In execution",
  COMPLETED: "Completed",
};

export function StateTimeline({ currentState, isFailed = false }: StateTimelineProps) {
  const currentIndex = STATES.indexOf(currentState);
  const displayStates = isFailed ? [...STATES.slice(0, currentIndex + 1), "FAILED" as CampaignState] : STATES;

  const getStateStatus = (state: CampaignState, index: number) => {
    if (state === "FAILED") return "failed";
    if (isFailed && index < displayStates.length - 1) return "completed";
    if (currentState === state) return "current";
    if (currentIndex > index || (isFailed && index < displayStates.indexOf("FAILED"))) return "completed";
    return "pending";
  };

  return (
    <div className="flex items-center gap-2" data-testid="state-timeline">
      {displayStates.map((state, index) => {
        const status = getStateStatus(state, index);
        const isLast = index === displayStates.length - 1;
        
        return (
          <div key={state} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  status === "completed" 
                    ? "bg-green-600 border-green-600 text-white" 
                    : status === "current"
                    ? "bg-chart-1 border-chart-1 text-white"
                    : status === "failed"
                    ? "bg-destructive border-destructive text-destructive-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
                data-testid={`timeline-step-${state}`}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : status === "current" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span 
                className={`text-xs font-medium whitespace-nowrap ${
                  status === "pending" ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {STATE_LABELS[state]}
              </span>
            </div>
            {!isLast && (
              <div 
                className={`w-8 h-0.5 mb-5 ${
                  status === "completed" || (isFailed && status !== "pending")
                    ? "bg-green-600" 
                    : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
