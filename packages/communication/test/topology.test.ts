import { describe, expect, it } from "vitest";

import {
  createDefaultTopology,
  createNotificationConsumerTopology,
  DEFAULT_EXCHANGE,
  DLQ_QUEUE,
  DLX_EXCHANGE,
  NOTIFICATION_QUEUE,
  NOTIFICATION_RETRY_QUEUE,
  NOTIFICATION_ROUTING_KEYS,
} from "../src/topology/index.js";

describe("createDefaultTopology", () => {
  it("builds the ZipFrames exchange, consumer queues and DLQ", () => {
    const topology = createDefaultTopology({
      consumerQueues: [
        {
          name: "processor.video.uploaded",
          routingKeys: ["video.uploaded"],
        },
        {
          name: "notification.video.failed",
          routingKeys: ["video.failed", "user.registered"],
        },
      ],
    });

    expect(topology.exchanges.map((exchange) => exchange.name)).toEqual([
      "zipframes.events",
      "zipframes.events.dlx",
    ]);
    expect(topology.queues.map((queue) => queue.name)).toEqual([
      "zipframes.events.dlq",
      "processor.video.uploaded",
      "notification.video.failed",
    ]);
    expect(topology.bindings).toEqual(
      expect.arrayContaining([
        {
          queue: "zipframes.events.dlq",
          exchange: "zipframes.events.dlx",
          routingKey: "#",
        },
        {
          queue: "processor.video.uploaded",
          exchange: "zipframes.events",
          routingKey: "video.uploaded",
        },
        {
          queue: "notification.video.failed",
          exchange: "zipframes.events",
          routingKey: "user.registered",
        },
      ]),
    );
  });

  it("accepts custom dead-letter names", () => {
    const topology = createDefaultTopology({
      consumerQueues: [],
      deadLetterExchange: "custom.dlx",
      deadLetterQueue: "custom.dlq",
    });

    expect(topology.exchanges[1]?.name).toBe("custom.dlx");
    expect(topology.queues[0]?.name).toBe("custom.dlq");
  });
});

describe("createNotificationConsumerTopology", () => {
  it("binds identity and video outcome events to one service queue", () => {
    const topology = createNotificationConsumerTopology();
    const main = topology.queues.find((queue) => queue.name === NOTIFICATION_QUEUE);
    const retry = topology.queues.find((queue) => queue.name === NOTIFICATION_RETRY_QUEUE);

    expect(NOTIFICATION_ROUTING_KEYS).toEqual([
      "user.registered",
      "user.updated",
      "user.deleted",
      "video.processed",
      "video.failed",
    ]);
    expect(main?.deadLetterExchange).toBe(DLX_EXCHANGE);
    expect(main?.deadLetterRoutingKey).toBe(NOTIFICATION_QUEUE);
    expect(retry?.deadLetterExchange).toBe(DEFAULT_EXCHANGE);
    expect(retry?.deadLetterRoutingKey).toBe(NOTIFICATION_QUEUE);
    expect(topology.bindings).toEqual(
      expect.arrayContaining([
        { queue: DLQ_QUEUE, exchange: DLX_EXCHANGE, routingKey: "#" },
        ...NOTIFICATION_ROUTING_KEYS.map((routingKey) => ({
          queue: NOTIFICATION_QUEUE,
          exchange: "zipframes.events",
          routingKey,
        })),
      ]),
    );
  });

  it("never routes a retry through the shared events exchange", () => {
    const retry = createNotificationConsumerTopology().queues.find(
      (queue) => queue.name === NOTIFICATION_RETRY_QUEUE,
    );

    expect(retry?.deadLetterExchange).not.toBe("zipframes.events");
    expect(retry?.deadLetterExchange).toBe("");
  });
});
