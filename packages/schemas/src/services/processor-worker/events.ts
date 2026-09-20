import { z } from "zod";

import { eventEnvelopeSchema } from "../../shared/envelope.js";

export const videoProcessingStartedPayloadSchema = z.object({
  videoId: z.string().uuid(),
  attempt: z.number().int().positive(),
});

export const videoProcessedPayloadSchema = z.object({
  videoId: z.string().uuid(),
  resultKey: z.string().min(1),
  frameCount: z.number().int().positive(),
  durationMs: z.number().int().nonnegative(),
});

export const videoFailedPayloadSchema = z.object({
  videoId: z.string().uuid(),
  ownerId: z.string().min(1),
  errorCode: z.string().min(1),
  reason: z.string().min(1),
  attempts: z.number().int().positive(),
});

export const videoProcessingStartedEventSchema = eventEnvelopeSchema(
  videoProcessingStartedPayloadSchema,
).extend({
  eventType: z.literal("video.processing.started"),
  version: z.literal(1),
});

export const videoProcessedEventSchema = eventEnvelopeSchema(videoProcessedPayloadSchema).extend({
  eventType: z.literal("video.processed"),
  version: z.literal(1),
});

export const videoFailedEventSchema = eventEnvelopeSchema(videoFailedPayloadSchema).extend({
  eventType: z.literal("video.failed"),
  version: z.literal(1),
});

export type VideoProcessingStartedPayload = z.infer<typeof videoProcessingStartedPayloadSchema>;
export type VideoProcessedPayload = z.infer<typeof videoProcessedPayloadSchema>;
export type VideoFailedPayload = z.infer<typeof videoFailedPayloadSchema>;
export type VideoProcessingStartedEvent = z.infer<typeof videoProcessingStartedEventSchema>;
export type VideoProcessedEvent = z.infer<typeof videoProcessedEventSchema>;
export type VideoFailedEvent = z.infer<typeof videoFailedEventSchema>;
