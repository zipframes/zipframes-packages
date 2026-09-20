import { describe, expect, it } from "vitest";

import type { EventEnvelope } from "@zipframes/schemas/shared";

import { createConsumer } from "../src/consumer/index.js";
import { createPublisher } from "../src/publisher/index.js";
import { createDefaultTopology } from "../src/topology/index.js";
import { createInMemoryBroker } from "./in-memory-broker.js";

const envelope = (type: string, payload: Record<string, unknown>): EventEnvelope<unknown> => ({
  eventId: "11111111-1111-4111-8111-111111111111",
  eventType: type,
  version: 1,
  occurredAt: "2026-09-17T12:00:00.000Z",
  correlationId: "22222222-2222-4222-8222-222222222222",
  payload,
});

describe("in-memory publisher and consumer", () => {
  it("routes published events to bound queues", async () => {
    const broker = createInMemoryBroker();
    const publisher = createPublisher(broker);
    const topology = createDefaultTopology({
      consumerQueues: [{ name: "processor.video.uploaded", routingKeys: ["video.uploaded"] }],
    });

    await broker.assertTopology(topology);
    await publisher.publish(envelope("video.uploaded", { videoId: "v1" }), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });

    expect(broker.published).toHaveLength(1);
    expect(broker.queues.get("processor.video.uploaded")).toHaveLength(1);
  });

  it("acks successful handling", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: "q", routingKeys: ["video.uploaded"] }],
      }),
    );
    await broker.publish(envelope("video.uploaded", {}), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });

    const seen: string[] = [];
    const consumer = createConsumer(
      broker,
      async (message, context) => {
        seen.push(message.envelope.eventType);
        await context.ack();
      },
      {
        queue: "q",
        deadLetterQueue: "zipframes.events.dlq",
        retry: { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 },
      },
    );

    await consumer.start();
    expect(seen).toEqual(["video.uploaded"]);
    expect(broker.queues.get("q")).toEqual([]);
    await consumer.stop();
  });

  it("retries then dead-letters after maxAttempts", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: "q", routingKeys: ["video.failed"] }],
      }),
    );
    await broker.publish(envelope("video.failed", {}), {
      exchange: "zipframes.events",
      routingKey: "video.failed",
    });

    const attempts: number[] = [];
    const consumer = createConsumer(
      broker,
      async (_message, context) => {
        attempts.push(context.attempt);
        await context.retry();
      },
      {
        queue: "q",
        deadLetterQueue: "zipframes.events.dlq",
        retry: { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );

    await consumer.start();
    // drain requeues
    await consumer.start();
    await consumer.start();

    expect(attempts.length).toBeGreaterThanOrEqual(2);
    expect(broker.queues.get("zipframes.events.dlq")?.length).toBeGreaterThanOrEqual(1);
  });

  it("dead-letters when the handler asks for it, and retries on throw", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: "q", routingKeys: ["#"] }],
      }),
    );

    broker.enqueue("q", {
      envelope: envelope("user.registered", {}),
      headers: {},
      routingKey: "user.registered",
    });

    const dlqConsumer = createConsumer(
      broker,
      async (_message, context) => {
        await context.deadLetter();
      },
      {
        queue: "q",
        deadLetterQueue: "zipframes.events.dlq",
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await dlqConsumer.start();
    expect(broker.queues.get("zipframes.events.dlq")).toHaveLength(1);

    broker.enqueue("q", {
      envelope: envelope("user.updated", {}),
      headers: { "x-attempt": "1" },
      routingKey: "user.updated",
    });

    const throwing = createConsumer(
      broker,
      async () => {
        throw new Error("boom");
      },
      {
        queue: "q",
        deadLetterQueue: "zipframes.events.dlq",
        retry: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await throwing.start();
    expect(broker.queues.get("q")).toEqual([]);
    expect(broker.queues.get("zipframes.events.dlq")?.length).toBeGreaterThanOrEqual(2);
  });

  it("auto-acks when the handler settles nothing, and ignores double settle", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: "q", routingKeys: ["video.processed"] }],
      }),
    );
    await broker.publish(envelope("video.processed", {}), {
      exchange: "zipframes.events",
      routingKey: "video.processed",
      headers: { trace: "1" },
      confirm: true,
    });

    const consumer = createConsumer(
      broker,
      async (_message, context) => {
        await context.ack();
        await context.retry();
      },
      {
        queue: "q",
        deadLetterQueue: "zipframes.events.dlq",
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await consumer.start();
    expect(broker.queues.get("q")).toEqual([]);

    await broker.publish(envelope("video.processed", {}), {
      exchange: "zipframes.events",
      routingKey: "video.processed",
    });
    const autoAck = createConsumer(broker, async () => undefined, {
      queue: "q",
      deadLetterQueue: "zipframes.events.dlq",
      retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
    });
    await autoAck.start();
    expect(broker.queues.get("q")).toEqual([]);
  });

  it("matches wildcard bindings and supports unmatched publishes", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology({
      exchanges: [{ name: "zipframes.events", type: "topic" }],
      queues: [{ name: "q" }, { name: "all" }],
      bindings: [
        { queue: "q", exchange: "zipframes.events", routingKey: "video.*" },
        { queue: "all", exchange: "zipframes.events", routingKey: "#" },
        { queue: "q", exchange: "zipframes.events", routingKey: "video.#" },
      ],
    });

    await broker.publish(envelope("video.uploaded", {}), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });
    await broker.publish(envelope("user.registered", {}), {
      exchange: "zipframes.events",
      routingKey: "user.registered",
    });
    await broker.publish(envelope("video.a.b", {}), {
      exchange: "zipframes.events",
      routingKey: "video.a.b",
    });

    expect(broker.queues.get("all")?.length).toBe(3);
    expect(broker.queues.get("q")?.length).toBeGreaterThanOrEqual(1);
  });

  it("creates missing queues lazily when binding or enqueueing", async () => {
    const broker = createInMemoryBroker();
    await broker.assertTopology({
      exchanges: [{ name: "zipframes.events", type: "topic" }],
      queues: [],
      bindings: [{ queue: "ghost", exchange: "zipframes.events", routingKey: "video.uploaded" }],
    });

    await broker.publish(envelope("video.uploaded", {}), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });
    expect(broker.queues.get("ghost")).toHaveLength(1);

    broker.enqueue("another-ghost", {
      envelope: envelope("video.failed", {}),
      headers: {},
      routingKey: "video.failed",
    });
    expect(broker.queues.get("another-ghost")).toHaveLength(1);
  });
});
