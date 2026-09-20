# @zipframes/logger

## 0.1.0

### Minor Changes

- [#14](https://github.com/zipframes/zipframes-packages/pull/14) [`81cdde7`](https://github.com/zipframes/zipframes-packages/commit/81cdde7779523188bf33d6b4998e2b7a129207ee) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/logger`:

  - `createLogger`: structured JSON logs with `service`, `version`, level and
    ISO timestamps, built on Pino.
  - Correlation ID helpers (`createCorrelationId`, `getCorrelationId`,
    `runWithCorrelationId`) that propagate the id through async work and attach
    it to every log line when one is in scope.
  - Default redaction of sensitive fields (`password`, `token`, `secret`,
    `authorization`, access/refresh tokens), with optional extra paths.
