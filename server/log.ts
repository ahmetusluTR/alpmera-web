import { randomUUID } from "crypto";
import { AsyncLocalStorage } from "async_hooks";

/**
 * Structured JSON Logging System
 *
 * Constitutional Enforcement:
 * - Article III §3.1: "No Silent Transitions" - All state changes must be traceable
 * - Article V §5.1: "Explainability Rule" - Every change must be explainable
 *
 * Elite Backend Standard:
 * - JSON logs with correlation IDs for distributed tracing
 * - Machine-readable for analysis and alerting
 * - Supports request lifecycle tracking
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  traceId?: string;
  userId?: string;
  campaignId?: string;
  commitmentId?: string;
  adminUsername?: string;
  [key: string]: any;
}

// AsyncLocalStorage for request-scoped trace IDs
export const traceContext = new AsyncLocalStorage<LogContext>();

/**
 * Structured logging function
 *
 * @param level - Log severity level
 * @param event - Machine-readable event name (e.g., "campaign_state_transition")
 * @param message - Human-readable message
 * @param context - Additional structured data
 */
export function structuredLog(
  level: LogLevel,
  event: string,
  message: string,
  context: LogContext = {}
): void {
  // Get trace context if available
  const asyncContext = traceContext.getStore() || {};

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    ...asyncContext,
    ...context,
    // Add hostname and PID for multi-instance deployments
    pid: process.pid,
    hostname: process.env.HOSTNAME || "unknown",
    env: process.env.NODE_ENV || "development",
  };

  // Output as single-line JSON for log aggregation systems
  console.log(JSON.stringify(logEntry));
}

/**
 * Legacy log function for backward compatibility
 * @deprecated Use structuredLog() instead
 */
export function log(message: string, source = "express"): void {
  structuredLog("info", "legacy_log", message, { source });
}

/**
 * Convenience logging functions
 */
export const logger = {
  debug: (event: string, message: string, context?: LogContext) =>
    structuredLog("debug", event, message, context),

  info: (event: string, message: string, context?: LogContext) =>
    structuredLog("info", event, message, context),

  warn: (event: string, message: string, context?: LogContext) =>
    structuredLog("warn", event, message, context),

  error: (event: string, message: string, context?: LogContext) =>
    structuredLog("error", event, message, context),

  // State transition logging (Constitutional enforcement)
  stateTransition: (
    entity: string,
    entityId: string,
    oldState: string,
    newState: string,
    context?: LogContext
  ) => {
    structuredLog("info", "state_transition",
      `${entity} ${entityId} transitioned from ${oldState} to ${newState}`,
      {
        entity,
        entityId,
        oldState,
        newState,
        ...context,
      }
    );
  },

  // Money operation logging (Escrow integrity)
  moneyOperation: (
    operation: string,
    amount: string,
    currency: string,
    context?: LogContext
  ) => {
    structuredLog("info", "money_operation",
      `${operation}: ${amount} ${currency}`,
      {
        operation,
        amount,
        currency,
        ...context,
      }
    );
  },
};

/**
 * Generate a new trace ID for a request
 */
export function generateTraceId(): string {
  return randomUUID();
}

/**
 * Express middleware to add trace ID to every request
 */
export function traceMiddleware(req: any, res: any, next: any): void {
  const traceId = req.headers["x-trace-id"] || generateTraceId();

  traceContext.run({ traceId }, () => {
    // Add trace ID to response headers for client correlation
    res.setHeader("x-trace-id", traceId);
    next();
  });
}
