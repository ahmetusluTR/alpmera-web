import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface ListSkeletonProps {
  rows?: number;
  columns?: number;
}

export function ListSkeleton({ rows = 6, columns = 6 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ListEmptyStateProps {
  title?: string;
  description?: string;
}

export function ListEmptyState({
  title = "No results",
  description = "No records match the current filters.",
}: ListEmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <div className="font-medium text-foreground">{title}</div>
      <div className="text-sm mt-1">{description}</div>
    </div>
  );
}

interface ListMismatchBannerProps {
  total: number;
}

export function ListMismatchBanner({ total }: ListMismatchBannerProps) {
  if (total <= 0) return null;
  return (
    <Card className="border-amber-200 bg-amber-50 text-amber-900 p-4 mb-4">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>
          Results mismatch: total is {total} but no rows were returned. Please refresh or clear filters.
        </span>
      </div>
    </Card>
  );
}
