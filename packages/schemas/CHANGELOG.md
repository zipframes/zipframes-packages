# @zipframes/schemas

## 0.1.2

### Patch Changes

- Updated dependencies [[`47e71c0`](https://github.com/zipframes/zipframes-packages/commit/47e71c0a4bff6ecceb0029311c686364dacdbe48)]:
  - @zipframes/core@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`663e368`](https://github.com/zipframes/zipframes-packages/commit/663e3688358011e52f6cb4e0f39b6bebf05e0150)]:
  - @zipframes/core@0.2.0

## 0.1.0

### Minor Changes

- [#18](https://github.com/zipframes/zipframes-packages/pull/18) [`58d133b`](https://github.com/zipframes/zipframes-packages/commit/58d133b5cd46c73b0c2c03e81a021593a19a9299) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/schemas`:

  - Shared event envelope and `zipframes.events` exchange name from the domain
    docs.
  - Auth, video and processor-worker event contracts (`user.*`, `video.uploaded`,
    `video.processing.started`, `video.processed`, `video.failed`).
  - HTTP request/response drafts for auth and video APIs, plus `parseSchema`
    returning `Result`.
  - Subpath exports per publishing service.
