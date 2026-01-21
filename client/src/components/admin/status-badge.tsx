import { Badge } from "@/components/ui/badge";

export interface StatusBadgeMapping {
  label: string;
  variant: "default" | "secondary" | "outline";
}

interface StatusBadgeProps {
  status: string;
  mapping?: Record<string, StatusBadgeMapping>;
}

export function StatusBadge({ status, mapping = {} }: StatusBadgeProps) {
  const entry = mapping[status];
  return (
    <Badge variant={entry?.variant || "outline"}>
      {entry?.label || status}
    </Badge>
  );
}
