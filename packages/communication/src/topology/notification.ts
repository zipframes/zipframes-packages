import { EVENT_EXCHANGE } from "@zipframes/schemas/shared";

import type { Topology } from "./topology.js";

/** The broker's nameless direct exchange, which routes by queue name. */
export const DEFAULT_EXCHANGE = "";
export const DLX_EXCHANGE = "zipframes.events.dlx";
export const DLQ_QUEUE = "zipframes.events.dlq";

export const NOTIFICATION_QUEUE = "notification-service.events";
/**
 * TTL wait queue. Expired messages return to {@link NOTIFICATION_QUEUE}
 * through the default exchange — never through `zipframes.events`, which
 * would redeliver `video.failed` / identity events to every other subscriber.
 */
export const NOTIFICATION_RETRY_QUEUE = "notification-service.events.retry";

export const NOTIFICATION_ROUTING_KEYS = [
  "user.registered",
  "user.updated",
  "user.deleted",
  "video.processed",
  "video.failed",
] as const;

/**
 * Own queue, retry without republishing onto `zipframes.events`, shared DLX.
 * notification-service asserts this topology at boot instead of copying AMQP wiring.
 */
export const createNotificationConsumerTopology = (): Topology => ({
  exchanges: [
    { name: EVENT_EXCHANGE, type: "topic", durable: true },
    { name: DLX_EXCHANGE, type: "topic", durable: true },
  ],
  queues: [
    { name: DLQ_QUEUE, durable: true },
    {
      name: NOTIFICATION_QUEUE,
      durable: true,
      deadLetterExchange: DLX_EXCHANGE,
      deadLetterRoutingKey: NOTIFICATION_QUEUE,
    },
    {
      name: NOTIFICATION_RETRY_QUEUE,
      durable: true,
      deadLetterExchange: DEFAULT_EXCHANGE,
      deadLetterRoutingKey: NOTIFICATION_QUEUE,
    },
  ],
  bindings: [
    { queue: DLQ_QUEUE, exchange: DLX_EXCHANGE, routingKey: "#" },
    ...NOTIFICATION_ROUTING_KEYS.map((routingKey) => ({
      queue: NOTIFICATION_QUEUE,
      exchange: EVENT_EXCHANGE,
      routingKey,
    })),
  ],
});
