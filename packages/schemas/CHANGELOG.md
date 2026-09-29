# @zipframes/schemas

## 1.2.0

### Minor Changes

- [#53](https://github.com/zipframes/zipframes-packages/pull/53) [`64de0a0`](https://github.com/zipframes/zipframes-packages/commit/64de0a001d0a9c621648871ef9f7575f00ee1ff8) Thanks [@knzt](https://github.com/knzt)! - - feat(schemas): filter the video list by status

## 1.1.0

### Minor Changes

- [#50](https://github.com/zipframes/zipframes-packages/pull/50) [`f0fb226`](https://github.com/zipframes/zipframes-packages/commit/f0fb22629fdb19660ec8aac3a05acf6a1a1d4b68) Thanks [@knzt](https://github.com/knzt)! - feat(schemas): add optional ownerId, originalFileName and uploadedAt on video outcome events

  feat(communication): add createNotifierEmailHelper for video.processed and video.failed

## 1.0.0

### Major Changes

- [#48](https://github.com/zipframes/zipframes-packages/pull/48) [`ebd6273`](https://github.com/zipframes/zipframes-packages/commit/ebd62732dd8b4d684f8eb130be4317117f3fde4b) Thanks [@knzt](https://github.com/knzt)! - - feat(schemas)!: replace the presigned upload contracts with a single multipart upload

### Minor Changes

- [#47](https://github.com/zipframes/zipframes-packages/pull/47) [`ec14344`](https://github.com/zipframes/zipframes-packages/commit/ec1434463e4d8f9d5bead547df76b6589ba72821) Thanks [@knzt](https://github.com/knzt)! - - feat: add problemDetailsSchema (core) and jsonSchemaOf (schemas)

### Patch Changes

- Updated dependencies [[`ec14344`](https://github.com/zipframes/zipframes-packages/commit/ec1434463e4d8f9d5bead547df76b6589ba72821)]:
  - @zipframes/core@0.5.0

## 0.2.0

### Minor Changes

- [#45](https://github.com/zipframes/zipframes-packages/pull/45) [`f5adac2`](https://github.com/zipframes/zipframes-packages/commit/f5adac2a4e8bb06ec5d097c2d9ff14df2fe8a436) Thanks [@knzt](https://github.com/knzt)! - - feat(schemas): add video-service route params and list query contracts

## 0.1.3

### Patch Changes

- Updated dependencies [[`5a06932`](https://github.com/zipframes/zipframes-packages/commit/5a06932307ba4124454ab4052a95bfb471122cdc)]:
  - @zipframes/core@0.4.0

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
