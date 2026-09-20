import { describe, expect, it } from "vitest";

import type { EventEnvelope } from "@zipframes/schemas/shared";
import { createDefaultTopology, createPublisher } from "@zipframes/communication";

import { createInMemoryBroker } from "../src/fixtures/index.js";

const envelope = (type: string): EventEnvelope<unknown> => ({
  eventId: "11111111-1111-4111-8111-111111111111",
  eventType: type,
  version: 1,
  occurredAt: "2026-09-17T12:00:00.000Z",
  correlationId: "22222222-2222-4222-8222-222222222222",
  payload: {},
});

describe("createInMemoryBroker", () => {
  it("routes published events through the ZipFrames topology", async () => {
    const broker = createInMemoryBroker();
    const publisher = createPublisher(broker);

    await broker.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: "processor.video.uploaded", routingKeys: ["video.uploaded"] }],
      }),
    );

    await publisher.publish(envelope("video.uploaded"), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });

    expect(broker.published).toHaveLength(1);
    expect(broker.queues.get("processor.video.uploaded")).toHaveLength(1);
  });

  it("supports wildcards, lazy queues and dequeue", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology({
      exchanges: [{ name: "zipframes.events", type: "topic" }],
      queues: [],
      bindings: [
        { queue: "all", exchange: "zipframes.events", routingKey: "#" },
        { queue: "videos", exchange: "zipframes.events", routingKey: "video.*" },
        { queue: "nested", exchange: "zipframes.events", routingKey: "video.#" },
      ],
    });

    await broker.publish(envelope("video.uploaded"), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });
    await broker.publish(envelope("user.registered"), {
      exchange: "zipframes.events",
      routingKey: "user.registered",
      headers: { trace: "1" },
    });
    await broker.publish(envelope("video.a.b"), {
      exchange: "zipframes.events",
      routingKey: "video.a.b",
    });

    expect(broker.queues.get("all")?.length).toBe(3);
    expect(broker.dequeue("all")?.envelope.eventType).toBe("video.uploaded");

    broker.enqueue("manual", {
      envelope: envelope("video.failed"),
      headers: {},
      routingKey: "video.failed",
    });
    expect(broker.dequeue("manual")?.routingKey).toBe("video.failed");
    expect(broker.dequeue("missing")).toBeUndefined();
  });
});
