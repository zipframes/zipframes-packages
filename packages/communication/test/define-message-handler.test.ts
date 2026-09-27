import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { eventEnvelopeSchema } from "@zipframes/schemas/shared";

import { defineMessageHandler } from "../src/handler/index.js";
import type { MessageHandlerConfig } from "../src/handler/index.js";
import type { BrokerMessage, ConsumeContext } from "../src/types.js";

const schema = eventEnvelopeSchema(z.object({ videoId: z.string() }));
type TestEvent = z.infer<typeof schema>;

const correlationId = "22222222-2222-4222-8222-222222222222";

const event: TestEvent = {
  eventId: "11111111-1111-4111-8111-111111111111",
  eventType: "video.uploaded",
  version: 1,
  occurredAt: "2026-09-17T12:00:00.000Z",
  correlationId,
  payload: { videoId: "video-1" },
};

const message = (envelope: unknown = event): BrokerMessage => ({
  envelope,
  headers: {},
  routingKey: "video.uploaded",
});

const contextAt = (
  attempt: number,
): ConsumeContext & {
  readonly ack: ReturnType<typeof vi.fn>;
  readonly retry: ReturnType<typeof vi.fn>;
  readonly deadLetter: ReturnType<typeof vi.fn>;
} => ({
  attempt,
  redelivered: attempt > 1,
  ack: vi.fn(async () => undefined),
  retry: vi.fn(async () => undefined),
  deadLetter: vi.fn(async () => undefined),
});

const retry = { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 };

const handlerWith = (
  overrides: Partial<MessageHandlerConfig<TestEvent, string>>,
): ReturnType<typeof defineMessageHandler> =>
  defineMessageHandler<TestEvent, string>({
    schema,
    retry,
    handle: async () => "done",
    ...overrides,
  });

describe("defineMessageHandler", () => {
  it("hands the typed event and attempt to handle, then acks", async () => {
    const handle = vi.fn(async () => "done");
    const onOutcome = vi.fn();
    const context = contextAt(2);

    await handlerWith({ handle, onOutcome })(message(), context);

    expect(handle).toHaveBeenCalledWith(event, { attempt: 2 });
    expect(context.ack).toHaveBeenCalledOnce();
    expect(context.retry).not.toHaveBeenCalled();
    expect(context.deadLetter).not.toHaveBeenCalled();
    expect(onOutcome).toHaveBeenCalledWith(
      { kind: "handled", event, result: "done" },
      { attempt: 2, durationMs: expect.any(Number) },
    );
  });

  it("dead-letters a poison envelope without calling handle", async () => {
    const handle = vi.fn(async () => "done");
    const onOutcome = vi.fn();
    const runInContext = vi.fn(async (_event: TestEvent, run: () => Promise<void>) => run());
    const context = contextAt(1);

    await handlerWith({ handle, onOutcome, runInContext })(
      message({ ...event, correlationId: 42 }),
      context,
    );

    expect(handle).not.toHaveBeenCalled();
    expect(runInContext).not.toHaveBeenCalled();
    expect(context.deadLetter).toHaveBeenCalledOnce();
    expect(onOutcome).toHaveBeenCalledWith(
      { kind: "poison", error: expect.objectContaining({ code: "SCHEMA_VALIDATION_FAILED" }) },
      expect.objectContaining({ attempt: 1 }),
    );
  });

  it("retries while attempts remain, without onExhausted", async () => {
    const failure = new Error("storage down");
    const onExhausted = vi.fn(async () => undefined);
    const onOutcome = vi.fn();
    const context = contextAt(2);

    await handlerWith({
      handle: async () => {
        throw failure;
      },
      onExhausted,
      onOutcome,
    })(message(), context);

    expect(context.retry).toHaveBeenCalledOnce();
    expect(context.deadLetter).not.toHaveBeenCalled();
    expect(onExhausted).not.toHaveBeenCalled();
    expect(onOutcome).toHaveBeenCalledWith(
      { kind: "retry", event, error: failure },
      expect.objectContaining({ attempt: 2 }),
    );
  });

  it("calls onExhausted then dead-letters on the last attempt", async () => {
    const failure = new Error("ffmpeg busy");
    const calls: string[] = [];
    const onExhausted = vi.fn(async () => {
      calls.push("onExhausted");
    });
    const context = contextAt(3);
    context.deadLetter.mockImplementation(async () => {
      calls.push("deadLetter");
    });
    const onOutcome = vi.fn();

    await handlerWith({
      handle: async () => {
        throw failure;
      },
      onExhausted,
      onOutcome,
    })(message(), context);

    expect(onExhausted).toHaveBeenCalledWith(event, failure, { attempt: 3 });
    expect(calls).toEqual(["onExhausted", "deadLetter"]);
    expect(context.retry).not.toHaveBeenCalled();
    expect(onOutcome).toHaveBeenCalledWith(
      { kind: "exhausted", event, error: failure },
      expect.objectContaining({ attempt: 3 }),
    );
  });

  it("dead-letters on the last attempt without onExhausted or onOutcome", async () => {
    const context = contextAt(3);

    await handlerWith({
      handle: async () => {
        throw new Error("down");
      },
    })(message(), context);

    expect(context.deadLetter).toHaveBeenCalledOnce();
  });

  it("lets an onExhausted failure escape without settling", async () => {
    const context = contextAt(3);

    await expect(
      handlerWith({
        handle: async () => {
          throw new Error("down");
        },
        onExhausted: async () => {
          throw new Error("publish failed");
        },
      })(message(), context),
    ).rejects.toThrow("publish failed");

    expect(context.deadLetter).not.toHaveBeenCalled();
    expect(context.retry).not.toHaveBeenCalled();
  });

  it("runs handling inside runInContext with the validated event", async () => {
    const seen: string[] = [];
    const context = contextAt(1);

    await handlerWith({
      runInContext: async (validated, run) => {
        seen.push(`enter:${validated.correlationId}`);
        await run();
        seen.push("leave");
      },
      handle: async () => {
        seen.push("handle");
        return "done";
      },
    })(message(), context);

    expect(seen).toEqual([`enter:${correlationId}`, "handle", "leave"]);
    expect(context.ack).toHaveBeenCalledOnce();
  });
});
