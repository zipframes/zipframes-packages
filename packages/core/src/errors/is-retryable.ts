import { isBaseError } from "./base-error.js";
import { InfrastructureError } from "./errors.js";

/**
 * Whether a thrown error should be retried.
 * Unknown errors are treated as retryable (safer for brokers).
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof InfrastructureError) {
    return error.retryable;
  }
  if (isBaseError(error)) {
    return false;
  }
  return true;
};
