import { z } from "zod";

import { eventEnvelopeSchema } from "../../shared/envelope.js";

export const userRegisteredPayloadSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

export const userUpdatedPayloadSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

export const userDeletedPayloadSchema = z.object({
  userId: z.string().uuid(),
});

export const userRegisteredEventSchema = eventEnvelopeSchema(userRegisteredPayloadSchema).extend({
  eventType: z.literal("user.registered"),
  version: z.literal(1),
});

export const userUpdatedEventSchema = eventEnvelopeSchema(userUpdatedPayloadSchema).extend({
  eventType: z.literal("user.updated"),
  version: z.literal(1),
});

export const userDeletedEventSchema = eventEnvelopeSchema(userDeletedPayloadSchema).extend({
  eventType: z.literal("user.deleted"),
  version: z.literal(1),
});

export type UserRegisteredPayload = z.infer<typeof userRegisteredPayloadSchema>;
export type UserUpdatedPayload = z.infer<typeof userUpdatedPayloadSchema>;
export type UserDeletedPayload = z.infer<typeof userDeletedPayloadSchema>;
export type UserRegisteredEvent = z.infer<typeof userRegisteredEventSchema>;
export type UserUpdatedEvent = z.infer<typeof userUpdatedEventSchema>;
export type UserDeletedEvent = z.infer<typeof userDeletedEventSchema>;
