import type { ValidationError } from "@zipframes/core/errors";
import { parseSchema } from "@zipframes/schemas";
import type { EventEnvelope } from "@zipframes/schemas/shared";
import type { z } from "zod";

import { decideRetry } from "../retry/index.js";
import type { RetryOptions } from "../retry/index.js";
import type { BrokerMessage, ConsumeContext, ConsumeHandler } from "../types.js";

export type MessageContext = {
  readonly attempt: number;
};

/** How a message ended. Handy for logs and metrics; settlement is already done. */
export type MessageOutcome<TEvent, TResult> =
  | { readonly kind: "poison"; readonly error: ValidationError }
  | { readonly kind: "handled"; readonly event: TEvent; readonly result: TResult }
  | { readonly kind: "retry"; readonly event: TEvent; readonly error: unknown }
  | { readonly kind: "exhausted"; readonly event: TEvent; readonly error: unknown };

export type MessageOutcomeContext = MessageContext & {
  readonly durationMs: number;
};

/** Transport concerns the composition root injects; the handler itself stays business-only. */
export type MessageHandlerOptions<TEvent, TResult> = {
  readonly retry: RetryOptions;
  /** Wraps validated handling, e.g. to run under the event's correlation id. */
  readonly runInContext?: (event: TEvent, run: () => Promise<void>) => Promise<void>;
  readonly onOutcome?: (
    outcome: MessageOutcome<TEvent, TResult>,
    ctx: MessageOutcomeContext,
  ) => void;
};

export type MessageHandlerConfig<TEvent, TResult> = MessageHandlerOptions<TEvent, TResult> & {
  readonly schema: z.ZodType<TEvent>;
  /** Throw to fail the attempt; the handler retries or dead-letters by `retry`. */
  readonly handle: (event: TEvent, ctx: MessageContext) => Promise<TResult>;
  /** Runs once, before the dead-letter, when the last attempt fails. */
  readonly onExhausted?: (event: TEvent, error: unknown, ctx: MessageContext) => Promise<void>;
};

/**
 * Validates the envelope, calls `handle` with the typed event and settles the
 * message: ack on success, retry while attempts remain, dead-letter when the
 * envelope is poison or attempts are exhausted.
 */
export const defineMessageHandler = <TEvent extends EventEnvelope<unknown>, TResult>(
  config: MessageHandlerConfig<TEvent, TResult>,
): ConsumeHandler => {
  const runInContext = config.runInContext ?? ((_event, run) => run());

  return async (message: BrokerMessage, context: ConsumeContext) => {
    const started = Date.now();
    const ctx: MessageContext = { attempt: context.attempt };
    const report = (outcome: MessageOutcome<TEvent, TResult>): void =>
      config.onOutcome?.(outcome, { ...ctx, durationMs: Date.now() - started });

    const parsed = parseSchema(config.schema, message.envelope);
    if (!parsed.ok) {
      report({ kind: "poison", error: parsed.error });
      await context.deadLetter();
      return;
    }
    const event = parsed.value;

    await runInContext(event, async () => {
      try {
        const result = await config.handle(event, ctx);
        report({ kind: "handled", event, result });
        await context.ack();
      } catch (error) {
        if (decideRetry(ctx.attempt, config.retry) === "retry") {
          report({ kind: "retry", event, error });
          await context.retry();
          return;
        }
        await config.onExhausted?.(event, error, ctx);
        report({ kind: "exhausted", event, error });
        await context.deadLetter();
      }
    });
  };
};
