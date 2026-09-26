import amqp from "amqplib";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { EventEnvelope } from "@zipframes/schemas/shared";
import { startRabbitMq } from "@zipframes/test-toolkit";
import type { RabbitMqHandle } from "@zipframes/test-toolkit";

import { createConsumer } from "../src/consumer/index.js";
import type { MessageQueue } from "../src/consumer/index.js";
import { createPublisher } from "../src/publisher/index.js";
import type { PublishPort } from "../src/publisher/index.js";
import { createDefaultTopology } from "../src/topology/index.js";
import type { Topology } from "../src/topology/index.js";
import type { BrokerMessage, MessageHeaders } from "../src/types.js";

const ROUTING_KEY_HEADER = "x-routing-key";

const envelope = (type: string, payload: Record<string, unknown> = {}): EventEnvelope<unknown> => ({
  eventId: "11111111-1111-4111-8111-111111111111",
  eventType: type,
  version: 1,
  occurredAt: "2026-09-17T12:00:00.000Z",
  correlationId: "22222222-2222-4222-8222-222222222222",
  payload,
});

type RabbitPort = PublishPort &
  MessageQueue & {
    readonly assertTopology: (topology: Topology) => Promise<void>;
    readonly waitForCount: (queue: string, expected: number) => Promise<void>;
    readonly pending: (queue: string) => number;
    readonly reset: () => Promise<void>;
    readonly close: () => Promise<void>;
  };

const headerValue = (value: unknown): string | undefined => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

const decode = (message: ConsumeMessage): BrokerMessage => {
  const envelopeBody = JSON.parse(message.content.toString()) as EventEnvelope<unknown>;
  const rawHeaders = message.properties.headers ?? {};
  const headers: Record<string, string> = {};
  let routingKey = message.fields.routingKey;

  for (const [key, value] of Object.entries(rawHeaders)) {
    const rendered = headerValue(value);
    if (rendered === undefined) {
      continue;
    }
    if (key === ROUTING_KEY_HEADER) {
      routingKey = rendered;
      continue;
    }
    headers[key] = rendered;
  }

  return { envelope: envelopeBody, headers, routingKey };
};

const stringHeaders = (headers: MessageHeaders | undefined): Record<string, string> => {
  const result: Record<string, string> = {};
  if (headers === undefined) {
    return result;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Queue port over a real broker. Exchanges, queues and bindings are declared
 * on RabbitMQ; nothing here simulates routing.
 */
const connectRabbitPort = async (amqpUri: string): Promise<RabbitPort> => {
  const connection = await amqp.connect(amqpUri);
  const channel: ConfirmChannel = await connection.createConfirmChannel();
  const buffers = new Map<string, BrokerMessage[]>();
  const consuming = new Set<string>();
  const declaredQueues: string[] = [];
  const declaredExchanges: string[] = [];

  const count = (queue: string): number => buffers.get(queue)?.length ?? 0;

  const push = (queue: string, message: BrokerMessage): void => {
    const current = buffers.get(queue) ?? [];
    current.push(message);
    buffers.set(queue, current);
  };

  const waitForDrain = async (): Promise<void> => {
    await channel.waitForConfirms();
  };

  return {
    assertTopology: async (topology) => {
      for (const exchange of topology.exchanges) {
        await channel.assertExchange(exchange.name, exchange.type, {
          durable: exchange.durable ?? true,
        });
        if (!declaredExchanges.includes(exchange.name)) {
          declaredExchanges.push(exchange.name);
        }
      }

      for (const queue of topology.queues) {
        const queueArguments: Record<string, string> = {};
        if (queue.deadLetterExchange !== undefined) {
          queueArguments["x-dead-letter-exchange"] = queue.deadLetterExchange;
        }
        if (queue.deadLetterRoutingKey !== undefined) {
          queueArguments["x-dead-letter-routing-key"] = queue.deadLetterRoutingKey;
        }

        await channel.assertQueue(queue.name, {
          durable: queue.durable ?? true,
          ...(Object.keys(queueArguments).length > 0 ? { arguments: queueArguments } : {}),
        });
        if (!buffers.has(queue.name)) {
          buffers.set(queue.name, []);
        }
        if (!declaredQueues.includes(queue.name)) {
          declaredQueues.push(queue.name);
        }
        if (!consuming.has(queue.name)) {
          await channel.consume(queue.name, (message) => {
            if (message === null) {
              return;
            }
            channel.ack(message);
            push(queue.name, decode(message));
          });
          consuming.add(queue.name);
        }
      }

      for (const binding of topology.bindings) {
        await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
      }
    },
    publish: async (body, options) => {
      const wrote = channel.publish(
        options.exchange,
        options.routingKey,
        Buffer.from(JSON.stringify(body)),
        {
          persistent: true,
          contentType: "application/json",
          headers: stringHeaders(options.headers),
        },
      );
      if (!wrote) {
        await new Promise<void>((resolve) => {
          channel.once("drain", () => resolve());
        });
      }
      if (options.confirm !== false) {
        await waitForDrain();
      }
    },
    enqueue: (queue, message) => {
      const headers = stringHeaders(message.headers);
      headers[ROUTING_KEY_HEADER] = message.routingKey;
      const wrote = channel.sendToQueue(queue, Buffer.from(JSON.stringify(message.envelope)), {
        persistent: true,
        contentType: "application/json",
        headers,
      });
      if (!wrote) {
        channel.once("drain", () => undefined);
      }
    },
    dequeue: (queue) => buffers.get(queue)?.shift(),
    pending: (queue) => count(queue),
    waitForCount: async (queue, expected) => {
      const deadline = Date.now() + 10_000;
      while (count(queue) < expected) {
        await waitForDrain();
        if (count(queue) >= expected) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
        if (Date.now() > deadline) {
          throw new Error(
            `timed out waiting for ${expected} message(s) on ${queue}; saw ${count(queue)}`,
          );
        }
      }
    },
    reset: async () => {
      for (const queue of declaredQueues) {
        buffers.delete(queue);
        consuming.delete(queue);
        await channel.deleteQueue(queue).catch(() => undefined);
      }
      declaredQueues.length = 0;
      for (const exchange of declaredExchanges) {
        await channel.deleteExchange(exchange).catch(() => undefined);
      }
      declaredExchanges.length = 0;
    },
    close: async () => {
      await channel.close();
      await connection.close();
    },
  };
};

describe("publisher and consumer over RabbitMQ", () => {
  let rabbit: RabbitMqHandle;
  let port: RabbitPort;

  beforeAll(async () => {
    rabbit = await startRabbitMq();
    port = await connectRabbitPort(rabbit.amqpUri);
  });

  afterEach(async () => {
    await port?.reset();
  });

  afterAll(async () => {
    await port?.close();
    await rabbit?.stop();
  });

  it("routes published events to bound queues", async () => {
    const publisher = createPublisher(port);
    await port.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: "processor.video.uploaded", routingKeys: ["video.uploaded"] }],
      }),
    );

    await publisher.publish(envelope("video.uploaded", { videoId: "v1" }), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });
    await port.waitForCount("processor.video.uploaded", 1);

    expect(port.pending("processor.video.uploaded")).toBe(1);
    expect(port.dequeue("processor.video.uploaded")?.envelope.eventType).toBe("video.uploaded");
  });

  it("acks successful handling", async () => {
    const queue = "ack.q";
    await port.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: queue, routingKeys: ["video.uploaded"] }],
        deadLetterQueue: "ack.dlq",
        deadLetterExchange: "ack.dlx",
      }),
    );
    await port.publish(envelope("video.uploaded"), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });
    await port.waitForCount(queue, 1);

    const seen: string[] = [];
    const consumer = createConsumer(
      port,
      async (message, context) => {
        seen.push(message.envelope.eventType);
        expect(context.attempt).toBe(1);
        expect(context.redelivered).toBe(false);
        await context.ack();
      },
      {
        queue,
        deadLetterQueue: "ack.dlq",
        retry: { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 },
      },
    );

    await consumer.start();
    expect(seen).toEqual(["video.uploaded"]);
    expect(port.pending(queue)).toBe(0);
    await consumer.stop();
  });

  it("retries then dead-letters after maxAttempts", async () => {
    const queue = "retry.q";
    const deadLetterQueue = "retry.dlq";
    await port.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: queue, routingKeys: ["video.failed"] }],
        deadLetterQueue,
        deadLetterExchange: "retry.dlx",
      }),
    );
    await port.publish(envelope("video.failed"), {
      exchange: "zipframes.events",
      routingKey: "video.failed",
    });
    await port.waitForCount(queue, 1);

    const attempts: number[] = [];
    const consumer = createConsumer(
      port,
      async (_message, context) => {
        attempts.push(context.attempt);
        expect(context.redelivered).toBe(context.attempt > 1);
        await context.retry();
      },
      {
        queue,
        deadLetterQueue,
        retry: { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );

    await consumer.start();
    await port.waitForCount(queue, 1);
    await consumer.start();
    await port.waitForCount(deadLetterQueue, 1);

    expect(attempts).toEqual([1, 2]);
    expect(port.pending(queue)).toBe(0);
    expect(port.dequeue(deadLetterQueue)?.routingKey).toBe("video.failed");
  });

  it("dead-letters when the handler asks for it, and retries on throw", async () => {
    const queue = "settle.q";
    const deadLetterQueue = "settle.dlq";
    await port.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: queue, routingKeys: ["#"] }],
        deadLetterQueue,
        deadLetterExchange: "settle.dlx",
      }),
    );

    port.enqueue(queue, {
      envelope: envelope("user.registered"),
      headers: {},
      routingKey: "user.registered",
    });
    await port.waitForCount(queue, 1);

    const dlqConsumer = createConsumer(
      port,
      async (_message, context) => {
        await context.deadLetter();
      },
      {
        queue,
        deadLetterQueue,
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await dlqConsumer.start();
    await port.waitForCount(deadLetterQueue, 1);
    expect(port.pending(deadLetterQueue)).toBe(1);

    port.enqueue(queue, {
      envelope: envelope("user.updated"),
      headers: { "x-attempt": "1" },
      routingKey: "user.updated",
    });
    await port.waitForCount(queue, 1);

    const throwing = createConsumer(
      port,
      async () => {
        throw new Error("boom");
      },
      {
        queue,
        deadLetterQueue,
        retry: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await throwing.start();
    await port.waitForCount(deadLetterQueue, 2);

    expect(port.pending(queue)).toBe(0);
    expect(port.pending(deadLetterQueue)).toBe(2);
  });

  it("auto-acks when the handler settles nothing, and ignores double settle", async () => {
    const queue = "auto.q";
    const deadLetterQueue = "auto.dlq";
    await port.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: queue, routingKeys: ["video.processed"] }],
        deadLetterQueue,
        deadLetterExchange: "auto.dlx",
      }),
    );
    await port.publish(envelope("video.processed"), {
      exchange: "zipframes.events",
      routingKey: "video.processed",
      headers: { trace: "1" },
      confirm: true,
    });
    await port.waitForCount(queue, 1);

    const consumer = createConsumer(
      port,
      async (_message, context) => {
        await context.ack();
        await context.retry();
      },
      {
        queue,
        deadLetterQueue,
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await consumer.start();
    expect(port.pending(queue)).toBe(0);

    await port.publish(envelope("video.processed"), {
      exchange: "zipframes.events",
      routingKey: "video.processed",
      confirm: false,
    });
    await port.waitForCount(queue, 1);
    const autoAck = createConsumer(port, async () => undefined, {
      queue,
      deadLetterQueue,
      retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
    });
    await autoAck.start();
    expect(port.pending(queue)).toBe(0);
  });

  it("matches wildcard bindings and drops unmatched routing keys", async () => {
    await port.assertTopology({
      exchanges: [{ name: "zipframes.events", type: "topic" }],
      queues: [{ name: "q" }, { name: "all" }],
      bindings: [
        { queue: "q", exchange: "zipframes.events", routingKey: "video.*" },
        { queue: "all", exchange: "zipframes.events", routingKey: "#" },
        { queue: "q", exchange: "zipframes.events", routingKey: "video.#" },
      ],
    });

    await port.publish(envelope("video.uploaded"), {
      exchange: "zipframes.events",
      routingKey: "video.uploaded",
    });
    await port.publish(envelope("user.registered"), {
      exchange: "zipframes.events",
      routingKey: "user.registered",
    });
    await port.publish(envelope("video.a.b"), {
      exchange: "zipframes.events",
      routingKey: "video.a.b",
    });

    await port.waitForCount("all", 3);
    await port.waitForCount("q", 2);
    expect(port.pending("q")).toBe(2);
  });

  it("reads attempt headers, including invalid values and a custom header name", async () => {
    const queue = "attempt.q";
    const deadLetterQueue = "attempt.dlq";
    await port.assertTopology(
      createDefaultTopology({
        consumerQueues: [{ name: queue, routingKeys: ["video.uploaded"] }],
        deadLetterQueue,
        deadLetterExchange: "attempt.dlx",
      }),
    );

    port.enqueue(queue, {
      envelope: envelope("video.uploaded"),
      headers: { "x-attempt": "0" },
      routingKey: "video.uploaded",
    });
    port.enqueue(queue, {
      envelope: envelope("video.uploaded"),
      headers: { "x-attempt": "nope" },
      routingKey: "video.uploaded",
    });
    await port.waitForCount(queue, 2);

    const attempts: number[] = [];
    const defaults = createConsumer(
      port,
      async (_message, context) => {
        attempts.push(context.attempt);
        await context.ack();
      },
      {
        queue,
        deadLetterQueue,
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await defaults.start();
    expect(attempts).toEqual([1, 1]);

    port.enqueue(queue, {
      envelope: envelope("video.uploaded"),
      headers: { "x-delivery": "2" },
      routingKey: "video.uploaded",
    });
    await port.waitForCount(queue, 1);

    const custom = createConsumer(
      port,
      async (_message, context) => {
        attempts.push(context.attempt);
        expect(context.redelivered).toBe(true);
        await context.ack();
        await custom.stop();
      },
      {
        queue,
        deadLetterQueue,
        attemptHeader: "x-delivery",
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10 },
      },
    );
    await custom.start();

    expect(attempts).toEqual([1, 1, 2]);
    expect(port.pending(queue)).toBe(0);
  });
});
