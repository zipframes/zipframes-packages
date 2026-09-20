---
"@zipframes/communication": minor
---

Add the first implementation of `@zipframes/communication`:

- Publisher/consumer ports over a queue abstraction, using the shared event
  envelope from `@zipframes/schemas`.
- Retry helpers (exponential backoff and DLQ decision) and the default
  `zipframes.events` topology with per-consumer queues and a shared DLQ.
- Consumer settlement API: ack, retry and deadLetter.

The in-memory broker used in tests lives in `@zipframes/test-toolkit`.
