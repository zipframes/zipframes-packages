# @zipframes/test-toolkit

## 0.2.0

### Minor Changes

- Remove `createInMemoryBroker`. The toolkit only starts containers (`startPostgres`, `startRabbitMq`, `startRedis`, `startS3`) and no longer depends on `@zipframes/communication`.

## 0.1.1

### Patch Changes

- Updated dependencies [[`663e368`](https://github.com/zipframes/zipframes-packages/commit/663e3688358011e52f6cb4e0f39b6bebf05e0150)]:
  - @zipframes/core@0.2.0
  - @zipframes/communication@0.1.1
  - @zipframes/schemas@0.1.1

## 0.1.0

### Minor Changes

- [#22](https://github.com/zipframes/zipframes-packages/pull/22) [`aec85ab`](https://github.com/zipframes/zipframes-packages/commit/aec85abcdea707217e3ad5aa38a5e9bc3d6d23c2) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/test-toolkit`:

  - Testcontainers helpers for PostgreSQL, RabbitMQ, Redis and S3-compatible
    MinIO storage.
  - `createInMemoryBroker`, moved out of `@zipframes/communication` so test-only
    doubles stay in a `devDependency`.

### Patch Changes

- Updated dependencies [[`aec85ab`](https://github.com/zipframes/zipframes-packages/commit/aec85abcdea707217e3ad5aa38a5e9bc3d6d23c2)]:
  - @zipframes/communication@0.1.0
