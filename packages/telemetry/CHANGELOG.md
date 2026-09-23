# @zipframes/telemetry

## 0.1.1

### Patch Changes

- Updated dependencies [[`663e368`](https://github.com/zipframes/zipframes-packages/commit/663e3688358011e52f6cb4e0f39b6bebf05e0150)]:
  - @zipframes/core@0.2.0

## 0.1.0

### Minor Changes

- [#17](https://github.com/zipframes/zipframes-packages/pull/17) [`f0ed32e`](https://github.com/zipframes/zipframes-packages/commit/f0ed32e36a69260748d2fe075efbb4de6adf91eb) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/telemetry`:

  - `createMetrics`: Prometheus registry with technical HTTP and message
    counters/histograms (no business metrics).
  - `initTracing`: OpenTelemetry bootstrap with injectable exporter/provider for
    tests, plus W3C inject/extract helpers for HTTP and message carriers.
  - `withSpan`: runs work inside a span and records exceptions.
