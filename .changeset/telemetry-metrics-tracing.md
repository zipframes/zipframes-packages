---
"@zipframes/telemetry": minor
---

Add the first implementation of `@zipframes/telemetry`:

- `createMetrics`: Prometheus registry with technical HTTP and message
  counters/histograms (no business metrics).
- `initTracing`: OpenTelemetry bootstrap with injectable exporter/provider for
  tests, plus W3C inject/extract helpers for HTTP and message carriers.
- `withSpan`: runs work inside a span and records exceptions.
