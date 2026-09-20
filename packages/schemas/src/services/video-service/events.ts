import { z } from "zod";

import { eventEnvelopeSchema } from "../../shared/envelope.js";

export const videoUploadedPayloadSchema = z.object({
  videoId: z.string().uuid(),
  ownerId: z.string().min(1),
  sourceKey: z.string().min(1),
  originalFileName: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export const videoUploadedEventSchema = eventEnvelopeSchema(videoUploadedPayloadSchema).extend({
  eventType: z.literal("video.uploaded"),
  version: z.literal(1),
});

export type VideoUploadedPayload = z.infer<typeof videoUploadedPayloadSchema>;
export type VideoUploadedEvent = z.infer<typeof videoUploadedEventSchema>;
