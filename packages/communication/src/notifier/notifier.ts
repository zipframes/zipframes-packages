import { randomUUID } from "node:crypto";

import type {
  UserDeletedPayload,
  UserRegisteredPayload,
  UserUpdatedPayload,
} from "@zipframes/schemas/auth-service";
import type {
  VideoFailedPayload,
  VideoProcessedPayload,
} from "@zipframes/schemas/processor-worker";
import { EVENT_EXCHANGE } from "@zipframes/schemas/shared";

import type { Publisher } from "../types.js";

export type NotifierVideoProcessedInput = {
  readonly correlationId: string;
  readonly payload: VideoProcessedPayload;
};

export type NotifierVideoFailedInput = {
  readonly correlationId: string;
  readonly payload: VideoFailedPayload;
};

export type NotifierUserRegisteredInput = {
  readonly correlationId: string;
  readonly payload: UserRegisteredPayload;
};

export type NotifierUserUpdatedInput = {
  readonly correlationId: string;
  readonly payload: UserUpdatedPayload;
};

export type NotifierUserDeletedInput = {
  readonly correlationId: string;
  readonly payload: UserDeletedPayload;
};

/**
 * Typed publisher for the events that trigger user e-mail. Services call
 * these methods instead of filling envelopes by hand so the payload cannot
 * drift from `@zipframes/schemas`. SMTP stays in notification-service.
 */
export type Notifier = {
  readonly videoProcessed: (input: NotifierVideoProcessedInput) => Promise<void>;
  readonly videoFailed: (input: NotifierVideoFailedInput) => Promise<void>;
  readonly userRegistered: (input: NotifierUserRegisteredInput) => Promise<void>;
  readonly userUpdated: (input: NotifierUserUpdatedInput) => Promise<void>;
  readonly userDeleted: (input: NotifierUserDeletedInput) => Promise<void>;
};

const publishNotificationEvent = async <TPayload>(
  publisher: Publisher,
  eventType: string,
  correlationId: string,
  payload: TPayload,
): Promise<void> => {
  await publisher.publish(
    {
      eventId: randomUUID(),
      eventType,
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      payload,
    },
    { exchange: EVENT_EXCHANGE, routingKey: eventType },
  );
};

export const createNotifier = (publisher: Publisher): Notifier => ({
  videoProcessed: ({ correlationId, payload }) =>
    publishNotificationEvent(publisher, "video.processed", correlationId, payload),
  videoFailed: ({ correlationId, payload }) =>
    publishNotificationEvent(publisher, "video.failed", correlationId, payload),
  userRegistered: ({ correlationId, payload }) =>
    publishNotificationEvent(publisher, "user.registered", correlationId, payload),
  userUpdated: ({ correlationId, payload }) =>
    publishNotificationEvent(publisher, "user.updated", correlationId, payload),
  userDeleted: ({ correlationId, payload }) =>
    publishNotificationEvent(publisher, "user.deleted", correlationId, payload),
});
