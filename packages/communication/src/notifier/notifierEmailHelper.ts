import { randomUUID } from "node:crypto";

import type {
  VideoFailedPayload,
  VideoProcessedPayload,
} from "@zipframes/schemas/processor-worker";
import { EVENT_EXCHANGE } from "@zipframes/schemas/shared";

import type { Publisher } from "../types.js";

export type NotifierEmailHelperVideoProcessedInput = {
  readonly correlationId: string;
  readonly payload: VideoProcessedPayload;
};

export type NotifierEmailHelperVideoFailedInput = {
  readonly correlationId: string;
  readonly payload: VideoFailedPayload;
};

/**
 * Typed publisher for the video-outcome events that trigger user e-mail.
 * Identity events stay on `EventPublisher`. SMTP stays in notifier-service.
 */
export type NotifierEmailHelper = {
  readonly videoProcessed: (input: NotifierEmailHelperVideoProcessedInput) => Promise<void>;
  readonly videoFailed: (input: NotifierEmailHelperVideoFailedInput) => Promise<void>;
};

const publishVideoOutcomeEvent = async <TPayload>(
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

export const createNotifierEmailHelper = (publisher: Publisher): NotifierEmailHelper => ({
  videoProcessed: ({ correlationId, payload }) =>
    publishVideoOutcomeEvent(publisher, "video.processed", correlationId, payload),
  videoFailed: ({ correlationId, payload }) =>
    publishVideoOutcomeEvent(publisher, "video.failed", correlationId, payload),
});
