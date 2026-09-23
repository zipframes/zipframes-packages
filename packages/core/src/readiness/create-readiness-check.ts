import type { Pingable } from "./pingable.js";

export interface ReadinessResult {
  readonly ready: boolean;
  readonly reason?: string;
}

/**
 * Runs every check in order. First failure becomes `{ ready: false, reason }`.
 */
export const createReadinessCheck =
  (checks: readonly Pingable[]) => async (): Promise<ReadinessResult> => {
    for (const check of checks) {
      try {
        await check.ping();
      } catch (error) {
        return {
          ready: false,
          reason: error instanceof Error ? error.message : "unknown",
        };
      }
    }
    return { ready: true };
  };
