import { describe, expect, it } from "vitest";

import { createDefaultTopology } from "../src/topology/index.js";

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
