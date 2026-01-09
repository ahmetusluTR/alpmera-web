export const STATE_COLORS: Record<string, string> = {
  AGGREGATION: "bg-chart-1 text-white",
  SUCCESS: "bg-green-600 dark:bg-green-700 text-white",
  FAILED: "bg-destructive text-destructive-foreground",
  FULFILLMENT: "bg-amber-600 dark:bg-amber-700 text-white",
  RELEASED: "bg-amber-600 dark:bg-amber-700 text-white",
};

export const STATE_LABELS: Record<string, string> = {
  AGGREGATION: "Building momentum",
  SUCCESS: "Target reached",
  FAILED: "Not completed",
  FULFILLMENT: "In fulfillment",
  RELEASED: "In fulfillment",
};

export function getStatusLabel(state: string): string {
  return STATE_LABELS[state] || state;
}

export function getStatusColor(state: string): string {
  return STATE_COLORS[state] || "bg-muted text-muted-foreground";
}
