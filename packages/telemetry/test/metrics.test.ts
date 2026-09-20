import { Registry } from "prom-client";
import { describe, expect, it } from "vitest";

import { createMetrics } from "../src/metrics/index.js";

describe("createMetrics", () => {
  it("registers the technical HTTP and message metrics", async () => {
    const registry = new Registry();
    const metrics = createMetrics({
      service: "video-service",
      version: "1.0.0",
      register: registry,
      collectDefaults: false,
    });

    metrics.httpRequestsTotal.inc({ method: "GET", route: "/videos", status: "200" });
    metrics.httpRequestDurationSeconds.observe(
      { method: "GET", route: "/videos", status: "200" },
      0.12,
    );
    metrics.messagesHandledTotal.inc({ destination: "video.uploaded", outcome: "ack" });
    metrics.messageDurationSeconds.observe({ destination: "video.uploaded", outcome: "ack" }, 0.4);

    const body = await registry.metrics();
    expect(body).toContain("http_requests_total");
    expect(body).toContain("http_request_duration_seconds");
    expect(body).toContain("messages_handled_total");
    expect(body).toContain("message_duration_seconds");
    expect(body).toContain('service="video-service"');
    expect(body).toContain('version="1.0.0"');
  });

  it("collects default metrics when enabled", async () => {
    const registry = new Registry();
    createMetrics({
      service: "video-service",
      version: "1.0.0",
      register: registry,
      collectDefaults: true,
    });

    const body = await registry.metrics();
    expect(body).toMatch(/process_|nodejs_/);
  });

  it("uses a fresh registry and default metric collection", async () => {
    const metrics = createMetrics({
      service: "auth-service",
      version: "0.1.0",
    });

    const body = await metrics.registry.metrics();
    expect(body).toContain("http_requests_total");
    expect(body).toMatch(/process_|nodejs_/);
  });
});
