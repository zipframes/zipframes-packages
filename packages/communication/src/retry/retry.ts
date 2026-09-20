export type RetryOptions = {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly multiplier?: number;
};

export type RetryDecision = "retry" | "dlq";

/**
 * Exponential backoff capped at `maxDelayMs`.
 * `attempt` is 1-based (first failure => 1).
 */
export const computeBackoffMs = (attempt: number, options: RetryOptions): number => {
  if (attempt < 1) {
    throw new RangeError("attempt must be >= 1");
  }
  const multiplier = options.multiplier ?? 2;
  const delay = options.baseDelayMs * multiplier ** (attempt - 1);
  return Math.min(delay, options.maxDelayMs);
};

/** Chooses between another retry and the dead-letter queue. */
export const decideRetry = (attempt: number, options: RetryOptions): RetryDecision => {
  if (attempt < 1) {
    throw new RangeError("attempt must be >= 1");
  }
  return attempt < options.maxAttempts ? "retry" : "dlq";
};
