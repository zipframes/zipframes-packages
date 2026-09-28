import { randomUUID } from "node:crypto";

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

/**
 * Typed publisher for the video-outcome events that trigger user e-mail.
 * Identity events stay on `EventPublisher`. SMTP stays in
 * notification-service.
 */
export type Notifier = {
  readonly videoProcessed: (input: NotifierVideoProcessedInput) => Promise<void>;
  readonly videoFailed: (input: NotifierVideoFailedInput) => Promise<void>;
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
});
