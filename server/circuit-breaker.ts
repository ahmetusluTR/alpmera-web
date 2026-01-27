import { logger } from "./log";

/**
 * Circuit Breaker Pattern Implementation
 *
 * Constitutional Enforcement:
 * - Article V §5.2: "Failure Visibility Rule" - Campaign failure must be explicit
 * - Prevents cascading failures from external services
 *
 * Elite Backend Standard:
 * - Wrap ALL external calls (Payment Gateways, 3rd Party APIs) in a Circuit Breaker
 * - After N failures, fail fast for M seconds without calling downstream service
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail immediately
 * - HALF_OPEN: Testing if service recovered, allow one request through
 */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  /** Service name for logging */
  name: string;
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time to wait before attempting recovery in ms (default: 30000 = 30s) */
  resetTimeout?: number;
  /** Timeout for individual requests in ms (default: 10000 = 10s) */
  requestTimeout?: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly state: CircuitState,
    message: string
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly requestTimeout: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds
    this.requestTimeout = options.requestTimeout ?? 10000; // 10 seconds
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param fn - Async function to execute
   * @returns Promise with function result
   * @throws CircuitBreakerError if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.resetTimeout) {
        logger.info("circuit_breaker_half_open", `Circuit breaker ${this.name} transitioning to HALF_OPEN`, {
          serviceName: this.name,
          previousState: CircuitState.OPEN,
          newState: CircuitState.HALF_OPEN,
        });
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        // Circuit is still open, fail fast
        logger.warn("circuit_breaker_blocked", `Circuit breaker ${this.name} is OPEN, failing fast`, {
          serviceName: this.name,
          state: this.state,
          failureCount: this.failureCount,
          timeUntilRetry: this.resetTimeout - timeSinceLastFailure,
        });
        throw new CircuitBreakerError(
          this.name,
          CircuitState.OPEN,
          `Service ${this.name} is temporarily unavailable. Circuit breaker is open.`
        );
      }
    }

    try {
      // Execute with timeout
      const result = await this.withTimeout(fn(), this.requestTimeout);

      // Success - record and potentially close circuit
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure - record and potentially open circuit
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Wrap promise with timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // After 2 successes in HALF_OPEN, close the circuit
      if (this.successCount >= 2) {
        logger.info("circuit_breaker_closed", `Circuit breaker ${this.name} closed after recovery`, {
          serviceName: this.name,
          previousState: CircuitState.HALF_OPEN,
          newState: CircuitState.CLOSED,
        });
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.error("circuit_breaker_failure", `Circuit breaker ${this.name} recorded failure`, {
      serviceName: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      error: error?.message || String(error),
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery - immediately open circuit
      logger.warn("circuit_breaker_opened", `Circuit breaker ${this.name} opened due to failure during recovery`, {
        serviceName: this.name,
        previousState: CircuitState.HALF_OPEN,
        newState: CircuitState.OPEN,
      });
      this.state = CircuitState.OPEN;
    } else if (this.failureCount >= this.failureThreshold) {
      // Threshold reached - open circuit
      logger.warn("circuit_breaker_opened", `Circuit breaker ${this.name} opened after ${this.failureCount} failures`, {
        serviceName: this.name,
        previousState: CircuitState.CLOSED,
        newState: CircuitState.OPEN,
        failureThreshold: this.failureThreshold,
      });
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      lastFailureTime: this.lastFailureTime,
      timeSinceLastFailure: this.lastFailureTime ? Date.now() - this.lastFailureTime : null,
    };
  }

  /**
   * Manually reset circuit (for testing/admin operations)
   */
  reset(): void {
    logger.info("circuit_breaker_manual_reset", `Circuit breaker ${this.name} manually reset`, {
      serviceName: this.name,
      previousState: this.state,
    });
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a service
   */
  get(name: string, options?: Omit<CircuitBreakerOptions, "name">): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ name, ...options }));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats() {
    return Array.from(this.breakers.values()).map(breaker => breaker.getStats());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Global registry
export const circuitBreakers = new CircuitBreakerRegistry();

/**
 * Example usage:
 *
 * ```typescript
 * // Get or create a circuit breaker for a service
 * const paymentBreaker = circuitBreakers.get("payment-gateway", {
 *   failureThreshold: 3,
 *   resetTimeout: 60000, // 1 minute
 * });
 *
 * // Execute external call with protection
 * try {
 *   const result = await paymentBreaker.execute(async () => {
 *     return await paymentGateway.charge(amount);
 *   });
 * } catch (error) {
 *   if (error instanceof CircuitBreakerError) {
 *     // Circuit is open, service unavailable
 *     logger.error("payment_unavailable", "Payment service unavailable", { error });
 *   }
 *   throw error;
 * }
 * ```
 */
