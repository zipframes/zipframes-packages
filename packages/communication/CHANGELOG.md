# @zipframes/communication

## 0.1.0

### Minor Changes

- [#22](https://github.com/zipframes/zipframes-packages/pull/22) [`aec85ab`](https://github.com/zipframes/zipframes-packages/commit/aec85abcdea707217e3ad5aa38a5e9bc3d6d23c2) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/communication`:

  - Publisher/consumer ports over a queue abstraction, using the shared event
    envelope from `@zipframes/schemas`.
  - Retry helpers (exponential backoff and DLQ decision) and the default
    `zipframes.events` topology with per-consumer queues and a shared DLQ.
  - Consumer settlement API: ack, retry and deadLetter.

  The in-memory broker used in tests lives in `@zipframes/test-toolkit`.
