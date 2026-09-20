import { z } from "zod";

/**
 * Envelope shared by every integration event on `zipframes.events`.
 * Defined in knzt/zipframes docs/domain/dominio.md.
 */
export const eventEnvelopeSchema = <TPayload extends z.ZodType>(payload: TPayload) =>
  z.object({
    eventId: z.string().uuid(),
    eventType: z.string().min(1),
    version: z.number().int().positive(),
    occurredAt: z.string().datetime(),
    correlationId: z.string().uuid(),
    payload,
  });

export type EventEnvelope<TPayload> = {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly payload: TPayload;
};

export const EVENT_EXCHANGE = "zipframes.events" as const;
