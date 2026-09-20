import { SpanStatusCode, context, trace } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isErr, isOk } from "@zipframes/core/result";

import {
  extractContext,
  extractHttpContext,
  extractMessageContext,
  initTracing,
  injectContext,
  injectHttpContext,
  injectMessageContext,
  withSpan,
} from "../src/tracing/index.js";

afterEach(async () => {
  trace.disable();
});

describe("initTracing", () => {
  it("rejects an empty service name", () => {
    const result = initTracing({ service: "  ", version: "1.0.0" });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("TELEMETRY_INVALID_SERVICE");
    }
  });

  it("rejects an empty version", () => {
    const result = initTracing({ service: "video-service", version: "" });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("TELEMETRY_INVALID_VERSION");
    }
  });

  it("uses an injected provider", async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });

    const result = initTracing({
      service: "video-service",
      version: "1.0.0",
      provider,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }

    await withSpan(result.value.tracer, "work", async (span) => {
      span.setAttribute("ok", true);
      return "done";
    });

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0]?.name).toBe("work");

    const shutdown = await result.value.shutdown();
    expect(isOk(shutdown)).toBe(true);
  });

  it("maps provider shutdown failures", async () => {
    const result = initTracing({
      service: "video-service",
      version: "1.0.0",
      provider: {
        getTracer: () => trace.getTracer("test"),
        shutdown: async () => {
          throw new Error("nope");
        },
      },
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }

    const shutdown = await result.value.shutdown();
    expect(isErr(shutdown)).toBe(true);
    if (isErr(shutdown)) {
      expect(shutdown.error.code).toBe("TELEMETRY_SHUTDOWN_FAILED");
    }
  });

  it("allows a provider without a shutdown hook", async () => {
    const result = initTracing({
      service: "video-service",
      version: "1.0.0",
      provider: {
        getTracer: () => trace.getTracer("test"),
      },
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }

    const shutdown = await result.value.shutdown();
    expect(isOk(shutdown)).toBe(true);
  });

  it("maps shutdown failures from the built-in provider", async () => {
    const result = initTracing({
      service: "video-service",
      version: "1.0.0",
      exporter: {
        export: (_spans, resultCallback) => {
          resultCallback({ code: 0 });
        },
        shutdown: async () => {
          throw new Error("exporter down");
        },
      },
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }

    const shutdown = await result.value.shutdown();
    expect(isErr(shutdown)).toBe(true);
    if (isErr(shutdown)) {
      expect(shutdown.error.code).toBe("TELEMETRY_SHUTDOWN_FAILED");
    }
  });

  it("maps initialization failures", async () => {
    const { BasicTracerProvider } = await import("@opentelemetry/sdk-trace-base");
    const original = BasicTracerProvider;
    const spy = vi
      .spyOn(await import("@opentelemetry/sdk-trace-base"), "BasicTracerProvider")
      .mockImplementationOnce(() => {
        throw new Error("cannot boot");
      });

    const result = initTracing({
      service: "video-service",
      version: "1.0.0",
      exporter: new InMemorySpanExporter(),
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("TELEMETRY_INIT_FAILED");
    }

    spy.mockRestore();
    expect(original).toBeTruthy();
  });

  it("boots with an injected exporter", async () => {
    const exporter = new InMemorySpanExporter();
    const result = initTracing({
      service: "video-service",
      version: "1.0.0",
      exporter,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }

    await withSpan(result.value.tracer, "exported", () => undefined);
    expect(exporter.getFinishedSpans()[0]?.name).toBe("exported");
    await result.value.shutdown();
  });

  it("boots with an OTLP endpoint and without an exporter", async () => {
    const withEndpoint = initTracing({
      service: "video-service",
      version: "1.0.0",
      endpoint: "http://127.0.0.1:4318/v1/traces",
    });
    expect(isOk(withEndpoint)).toBe(true);
    if (isOk(withEndpoint)) {
      await withEndpoint.value.shutdown();
    }

    const withoutExporter = initTracing({
      service: "video-service",
      version: "1.0.0",
    });
    expect(isOk(withoutExporter)).toBe(true);
    if (isOk(withoutExporter)) {
      await withoutExporter.value.shutdown();
    }
  });
});

describe("context propagation", () => {
  it("round-trips W3C trace context through HTTP and message carriers", async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    const init = initTracing({
      service: "video-service",
      version: "1.0.0",
      provider,
    });
    expect(isOk(init)).toBe(true);
    if (!isOk(init)) {
      return;
    }

    const parent = init.value.tracer.startSpan("parent");
    const parentCtx = trace.setSpan(context.active(), parent);

    const httpCarrier: Record<string, string | undefined> = {};
    injectHttpContext(httpCarrier, parentCtx);
    expect(httpCarrier.traceparent).toMatch(/^00-/);

    const messageCarrier: Record<string, string | undefined> = {};
    injectMessageContext(messageCarrier, parentCtx);
    expect(messageCarrier.traceparent).toBe(httpCarrier.traceparent);

    const extractedHttp = extractHttpContext(httpCarrier);
    const extractedMessage = extractMessageContext(messageCarrier);
    expect(trace.getSpan(extractedHttp)?.spanContext().traceId).toBe(parent.spanContext().traceId);
    expect(trace.getSpan(extractedMessage)?.spanContext().traceId).toBe(
      parent.spanContext().traceId,
    );

    // exercise the non-aliased helpers too
    const carrier: Record<string, string | undefined> = {};
    injectContext(carrier, parentCtx);
    expect(extractContext(carrier)).toBeTruthy();

    parent.end();
    await init.value.shutdown();
  });
});

describe("withSpan", () => {
  it("records exceptions and rethrows", async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    const init = initTracing({
      service: "video-service",
      version: "1.0.0",
      provider,
    });
    expect(isOk(init)).toBe(true);
    if (!isOk(init)) {
      return;
    }

    await expect(
      withSpan(init.value.tracer, "failing", async () => {
        throw new Error("explode");
      }),
    ).rejects.toThrow("explode");

    const span = exporter.getFinishedSpans()[0];
    expect(span?.status.code).toBe(SpanStatusCode.ERROR);
    expect(span?.events.some((event) => event.name === "exception")).toBe(true);

    await expect(
      withSpan(init.value.tracer, "failing-non-error", async () => {
        throw "plain";
      }),
    ).rejects.toBe("plain");

    await init.value.shutdown();
  });
});
