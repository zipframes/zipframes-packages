import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export type MetricsOptions = {
  readonly service: string;
  readonly version: string;
  /** Inject a registry in tests. Defaults to a fresh Registry. */
  readonly register?: Registry;
  /** Collect Node.js default metrics. Defaults to true. */
  readonly collectDefaults?: boolean;
};

export type TechnicalMetrics = {
  readonly registry: Registry;
  readonly httpRequestsTotal: Counter<"method" | "route" | "status">;
  readonly httpRequestDurationSeconds: Histogram<"method" | "route" | "status">;
  readonly messagesHandledTotal: Counter<"destination" | "outcome">;
  readonly messageDurationSeconds: Histogram<"destination" | "outcome">;
};

/**
 * Builds the shared technical metrics every service exposes. Business metrics
 * stay in the service that owns them.
 */
export const createMetrics = (options: MetricsOptions): TechnicalMetrics => {
  const registry = options.register ?? new Registry();
  registry.setDefaultLabels({
    service: options.service,
    version: options.version,
  });

  if (options.collectDefaults ?? true) {
    collectDefaultMetrics({ register: registry });
  }

  const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests handled",
    labelNames: ["method", "route", "status"] as const,
    registers: [registry],
  });

  const httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  const messagesHandledTotal = new Counter({
    name: "messages_handled_total",
    help: "Total number of messages handled",
    labelNames: ["destination", "outcome"] as const,
    registers: [registry],
  });

  const messageDurationSeconds = new Histogram({
    name: "message_duration_seconds",
    help: "Duration of message handling in seconds",
    labelNames: ["destination", "outcome"] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
    registers: [registry],
  });

  return {
    registry,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    messagesHandledTotal,
    messageDurationSeconds,
  };
};
