import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const storage = new AsyncLocalStorage<string>();

/**
 * Returns the correlation id of the current async context, if one was set.
 */
export const getCorrelationId = (): string | undefined => storage.getStore();

/**
 * Generates a new correlation id. Callers that received one over the wire
 * should keep it; this is for the first hop that has nothing to propagate.
 */
export const createCorrelationId = (): string => randomUUID();

/**
 * Runs `fn` with `correlationId` available to every logger call that happens
 * inside it, including awaited work.
 */
export const runWithCorrelationId = <T>(correlationId: string, fn: () => T): T =>
  storage.run(correlationId, fn);
