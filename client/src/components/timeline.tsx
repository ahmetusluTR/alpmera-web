import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string | Date;
  subtitle?: string;
  status?: "neutral" | "info" | "success" | "warning" | "danger";
  tags?: string[];
  meta?: Array<{ label: string; value: string }>;
  monospaceFields?: Array<{ label: string; value: string }>;
  details?: string;
  isImmutable?: boolean;
}

interface TimelineProps {
  title?: string;
  events: TimelineEvent[];
  density?: "compact" | "comfortable";
  showConnector?: boolean;
  emptyStateTitle?: string;
  emptyStateHint?: string;
}

const statusColors: Record<string, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};

export function Timeline({
  title,
  events,
  density = "comfortable",
  showConnector = true,
  emptyStateTitle = "No events",
  emptyStateHint,
}: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{emptyStateTitle}</p>
        {emptyStateHint && (
          <p className="text-xs text-muted-foreground mt-1">{emptyStateHint}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {title && (
        <h3 className="text-sm font-medium mb-4">{title}</h3>
      )}
      <div className={cn("space-y-4", density === "compact" && "space-y-2")}>
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const timestamp = typeof event.timestamp === "string" 
            ? new Date(event.timestamp) 
            : event.timestamp;
          
          return (
            <div
              key={event.id}
              className="relative flex gap-3"
              data-testid={`timeline-event-${event.id}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    statusColors[event.status || "neutral"]
                  )}
                />
                {showConnector && !isLast && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              <div className={cn("flex-1 pb-4", density === "compact" && "pb-2")}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{event.title}</span>
                    {event.isImmutable && (
                      <Badge variant="outline" className="text-xs">
                        Append-only record
                      </Badge>
                    )}
                    {event.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(timestamp, "MMM d, yyyy HH:mm")}
                  </span>
                </div>

                {event.subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {event.subtitle}
                  </p>
                )}

                {event.monospaceFields && event.monospaceFields.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {event.monospaceFields.map((field) => (
                      <div key={field.label} className="text-xs">
                        <span className="text-muted-foreground">{field.label}: </span>
                        <span className="font-mono">{field.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {event.meta && event.meta.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {event.meta.map((item) => (
                      <div key={item.label} className="text-xs">
                        <span className="text-muted-foreground">{item.label}: </span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {event.details && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {event.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
