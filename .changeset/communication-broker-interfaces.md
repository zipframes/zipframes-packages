---
"@zipframes/communication": minor
---

Add the first implementation of `@zipframes/communication`:

- In-memory broker plus publisher/consumer interfaces that take the shared
  event envelope from `@zipframes/schemas`.
- Retry helpers (exponential backoff and DLQ decision) and the default
  `zipframes.events` topology with per-consumer queues and a shared DLQ.
- Consumer settlement API: ack, retry and deadLetter.
