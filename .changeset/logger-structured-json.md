---
"@zipframes/logger": minor
---

Add the first implementation of `@zipframes/logger`:

- `createLogger`: structured JSON logs with `service`, `version`, level and
  ISO timestamps, built on Pino.
- Correlation ID helpers (`createCorrelationId`, `getCorrelationId`,
  `runWithCorrelationId`) that propagate the id through async work and attach
  it to every log line when one is in scope.
- Default redaction of sensitive fields (`password`, `token`, `secret`,
  `authorization`, access/refresh tokens), with optional extra paths.
