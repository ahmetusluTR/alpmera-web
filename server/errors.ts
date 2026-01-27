import type { Response } from "express";

/**
 * RFC 7807 Problem Details for HTTP APIs
 *
 * Elite Backend Standard: Use RFC 7807 Problem Details instead of ad-hoc error responses
 * https://datatracker.ietf.org/doc/html/rfc7807
 *
 * Constitutional alignment: Supports Article V §5.1 - Explainability Rule
 * "Every money or state change must be explainable to a non-expert user."
 */

export interface ProblemDetails {
  // Required fields
  type: string;         // URI reference identifying the problem type
  title: string;        // Short, human-readable summary
  status: number;       // HTTP status code

  // Optional fields
  detail?: string;      // Human-readable explanation specific to this occurrence
  instance?: string;    // URI reference identifying this specific occurrence

  // Extension fields (domain-specific)
  [key: string]: any;
}

/**
 * Base Problem Detail types for Alpmera
 */
export const ProblemTypes = {
  // 4xx Client Errors
  VALIDATION_ERROR: "https://api.alpmera.com/problems/validation-error",
  RESOURCE_NOT_FOUND: "https://api.alpmera.com/problems/resource-not-found",
  AUTHENTICATION_REQUIRED: "https://api.alpmera.com/problems/authentication-required",
  FORBIDDEN: "https://api.alpmera.com/problems/forbidden",
  RATE_LIMIT_EXCEEDED: "https://api.alpmera.com/problems/rate-limit-exceeded",
  IDEMPOTENCY_CONFLICT: "https://api.alpmera.com/problems/idempotency-conflict",

  // Campaign-specific errors
  INVALID_STATE_TRANSITION: "https://api.alpmera.com/problems/invalid-state-transition",
  CAMPAIGN_NOT_JOINABLE: "https://api.alpmera.com/problems/campaign-not-joinable",
  INSUFFICIENT_ESCROW: "https://api.alpmera.com/problems/insufficient-escrow",
  COMMITMENT_LOCKED: "https://api.alpmera.com/problems/commitment-locked",

  // 5xx Server Errors
  INTERNAL_ERROR: "https://api.alpmera.com/problems/internal-error",
  SERVICE_UNAVAILABLE: "https://api.alpmera.com/problems/service-unavailable",
} as const;

/**
 * Send RFC 7807 Problem Details response
 */
export function sendProblem(res: Response, problem: ProblemDetails): void {
  res.status(problem.status)
    .setHeader("Content-Type", "application/problem+json")
    .json(problem);
}

/**
 * Convenience functions for common problems
 */
export const Problems = {
  /**
   * 400 Bad Request - Validation Error
   */
  validationError(detail: string, errors?: any): ProblemDetails {
    return {
      type: ProblemTypes.VALIDATION_ERROR,
      title: "Validation Error",
      status: 400,
      detail,
      errors,
    };
  },

  /**
   * 404 Not Found
   */
  notFound(resource: string, identifier?: string): ProblemDetails {
    return {
      type: ProblemTypes.RESOURCE_NOT_FOUND,
      title: "Resource Not Found",
      status: 404,
      detail: identifier
        ? `${resource} with identifier '${identifier}' was not found`
        : `${resource} not found`,
      resource,
      identifier,
    };
  },

  /**
   * 401 Unauthorized - Authentication Required
   */
  authenticationRequired(detail?: string): ProblemDetails {
    return {
      type: ProblemTypes.AUTHENTICATION_REQUIRED,
      title: "Authentication Required",
      status: 401,
      detail: detail || "Please log in to access this resource.",
    };
  },

  /**
   * 403 Forbidden
   */
  forbidden(detail?: string): ProblemDetails {
    return {
      type: ProblemTypes.FORBIDDEN,
      title: "Forbidden",
      status: 403,
      detail: detail || "You do not have permission to access this resource.",
    };
  },

  /**
   * 429 Too Many Requests
   */
  rateLimitExceeded(limit: number, window: string): ProblemDetails {
    return {
      type: ProblemTypes.RATE_LIMIT_EXCEEDED,
      title: "Rate Limit Exceeded",
      status: 429,
      detail: `You have exceeded the rate limit of ${limit} requests per ${window}.`,
      limit,
      window,
    };
  },

  /**
   * 409 Conflict - Idempotency Key Conflict
   */
  idempotencyConflict(detail?: string): ProblemDetails {
    return {
      type: ProblemTypes.IDEMPOTENCY_CONFLICT,
      title: "Request In Progress",
      status: 409,
      detail: detail || "This request is currently being processed. Please try again later.",
    };
  },

  /**
   * 400 Bad Request - Invalid State Transition
   * Constitutional enforcement: Article III §3.1 - No Silent Transitions
   */
  invalidStateTransition(
    currentState: string,
    attemptedState: string,
    validStates: string[]
  ): ProblemDetails {
    return {
      type: ProblemTypes.INVALID_STATE_TRANSITION,
      title: "Invalid State Transition",
      status: 400,
      detail: `Cannot transition from ${currentState} to ${attemptedState}. Valid transitions: ${validStates.join(", ") || "none"}`,
      currentState,
      attemptedState,
      validTransitions: validStates,
    };
  },

  /**
   * 403 Forbidden - Campaign Not Joinable
   */
  campaignNotJoinable(reason: string, campaignState?: string): ProblemDetails {
    return {
      type: ProblemTypes.CAMPAIGN_NOT_JOINABLE,
      title: "Campaign Not Joinable",
      status: 403,
      detail: reason,
      campaignState,
    };
  },

  /**
   * 402 Payment Required - Insufficient Escrow
   * Constitutional enforcement: Article IV §4.2 - Escrow Centrality
   */
  insufficientEscrow(required: string, available: string): ProblemDetails {
    return {
      type: ProblemTypes.INSUFFICIENT_ESCROW,
      title: "Insufficient Escrow",
      status: 402,
      detail: `Required escrow: ${required}, Available: ${available}`,
      required,
      available,
    };
  },

  /**
   * 409 Conflict - Commitment Already Locked
   */
  commitmentLocked(commitmentId: string): ProblemDetails {
    return {
      type: ProblemTypes.COMMITMENT_LOCKED,
      title: "Commitment Locked",
      status: 409,
      detail: "This commitment is locked and cannot be modified.",
      commitmentId,
    };
  },

  /**
   * 500 Internal Server Error
   */
  internalError(detail?: string, errorId?: string): ProblemDetails {
    return {
      type: ProblemTypes.INTERNAL_ERROR,
      title: "Internal Server Error",
      status: 500,
      detail: detail || "An unexpected error occurred. Please try again later.",
      errorId, // For support team to trace the error
    };
  },

  /**
   * 503 Service Unavailable
   */
  serviceUnavailable(service?: string): ProblemDetails {
    return {
      type: ProblemTypes.SERVICE_UNAVAILABLE,
      title: "Service Unavailable",
      status: 503,
      detail: service
        ? `The ${service} service is temporarily unavailable. Please try again later.`
        : "The service is temporarily unavailable. Please try again later.",
      service,
    };
  },
};

/**
 * Express error handler middleware for RFC 7807
 */
export function problemDetailsErrorHandler(err: any, req: any, res: Response, next: any): void {
  // If response already sent, delegate to default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Check if error is already a ProblemDetails
  if (err.type && err.title && err.status) {
    return sendProblem(res, err);
  }

  // Map common error types to Problem Details
  const status = err.status || err.statusCode || 500;

  if (status === 404) {
    return sendProblem(res, Problems.notFound("Resource", req.path));
  }

  if (status === 401) {
    return sendProblem(res, Problems.authenticationRequired(err.message));
  }

  if (status === 403) {
    return sendProblem(res, Problems.forbidden(err.message));
  }

  // Default to internal error for unhandled cases
  const errorId = Math.random().toString(36).substring(7);

  // Log the error with trace ID for debugging
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    event: "unhandled_error",
    message: err.message,
    errorId,
    stack: err.stack,
    path: req.path,
    method: req.method,
  }));

  sendProblem(res, Problems.internalError(
    process.env.NODE_ENV === 'production'
      ? undefined
      : err.message,
    errorId
  ));
}
