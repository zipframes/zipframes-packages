---
"@zipframes/test-toolkit": minor
---

Add the first implementation of `@zipframes/test-toolkit`:

- Testcontainers helpers for PostgreSQL, RabbitMQ, Redis and S3-compatible
  MinIO storage.
- `createInMemoryBroker`, moved out of `@zipframes/communication` so test-only
  doubles stay in a `devDependency`.
