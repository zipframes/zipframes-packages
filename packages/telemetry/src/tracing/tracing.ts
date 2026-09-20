import {
  SpanStatusCode,
  context,
  defaultTextMapGetter,
  defaultTextMapSetter,
  propagation,
  trace,
} from "@opentelemetry/api";
import type { Context, Span, TextMapPropagator, Tracer } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

import { InfrastructureError, ValidationError } from "@zipframes/core/errors";
import { err, ok } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";

export type Carrier = Record<string, string | undefined>;

export type TracingOptions = {
  readonly service: string;
  readonly version: string;
  /** OTLP HTTP endpoint. Ignored when `exporter` is provided. */
  readonly endpoint?: string;
  /** Inject an exporter in tests (for example InMemorySpanExporter). */
  readonly exporter?: SpanExporter;
  /** Replace the whole provider. Used to keep unit tests offline. */
  readonly provider?: {
    readonly getTracer: (name: string, version?: string) => Tracer;
    readonly shutdown?: () => Promise<void>;
  };
};

export type TracingHandle = {
  readonly tracer: Tracer;
  readonly shutdown: () => Promise<Result<void, InfrastructureError>>;
};

let activePropagator: TextMapPropagator | undefined;

const ensurePropagator = (): TextMapPropagator => {
  if (activePropagator === undefined) {
    activePropagator = new W3CTraceContextPropagator();
    propagation.setGlobalPropagator(activePropagator);
  }
  return activePropagator;
};

const shutdownFailure = (cause: unknown): InfrastructureError =>
  new InfrastructureError("TELEMETRY_SHUTDOWN_FAILED", "failed to shut down tracing", {
    cause,
    retryable: false,
  });

/**
 * Boots tracing for a service. Prefer injecting `exporter` or `provider` in
 * tests so nothing talks to a real collector.
 */
export const initTracing = (
  options: TracingOptions,
): Result<TracingHandle, ValidationError | InfrastructureError> => {
  if (options.service.trim().length === 0) {
    return err(new ValidationError("TELEMETRY_INVALID_SERVICE", "service must not be empty"));
  }
  if (options.version.trim().length === 0) {
    return err(new ValidationError("TELEMETRY_INVALID_VERSION", "version must not be empty"));
  }

  ensurePropagator();

  if (options.provider !== undefined) {
    const provider = options.provider;
    return ok({
      tracer: provider.getTracer(options.service, options.version),
      shutdown: async () => {
        try {
          await provider.shutdown?.();
          return ok(undefined);
        } catch (cause) {
          return err(shutdownFailure(cause));
        }
      },
    });
  }

  try {
    const exporter =
      options.exporter ??
      (options.endpoint !== undefined
        ? new OTLPTraceExporter({ url: options.endpoint })
        : undefined);

    const spanProcessors =
      exporter === undefined
        ? []
        : [
            options.exporter !== undefined
              ? new SimpleSpanProcessor(exporter)
              : new BatchSpanProcessor(exporter),
          ];

    const provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: options.service,
        [ATTR_SERVICE_VERSION]: options.version,
      }),
      spanProcessors,
    });

    trace.setGlobalTracerProvider(provider);

    return ok({
      tracer: provider.getTracer(options.service, options.version),
      shutdown: async () => {
        try {
          await provider.shutdown();
          return ok(undefined);
        } catch (cause) {
          return err(shutdownFailure(cause));
        }
      },
    });
  } catch (cause) {
    return err(
      new InfrastructureError("TELEMETRY_INIT_FAILED", "failed to initialize tracing", {
        cause,
        retryable: false,
      }),
    );
  }
};

/** Injects the active W3C trace context into a carrier (HTTP headers or message headers). */
export const injectContext = (carrier: Carrier, ctx: Context = context.active()): void => {
  ensurePropagator();
  propagation.inject(ctx, carrier, defaultTextMapSetter);
};

/** Extracts a W3C trace context from a carrier. */
export const extractContext = (carrier: Carrier, ctx: Context = context.active()): Context => {
  ensurePropagator();
  return propagation.extract(ctx, carrier, defaultTextMapGetter);
};

export const injectHttpContext = injectContext;
export const extractHttpContext = extractContext;
export const injectMessageContext = injectContext;
export const extractMessageContext = extractContext;

/**
 * Runs `fn` inside a span of the given name. Sets ERROR status when `fn`
 * throws, then rethrows.
 */
export const withSpan = async <T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => T | Promise<T>,
): Promise<T> => {
  const span = tracer.startSpan(name);
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const value = await fn(span);
      span.end();
      return value;
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      throw cause;
    }
  });
};
