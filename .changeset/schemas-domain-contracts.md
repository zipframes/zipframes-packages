---
"@zipframes/schemas": minor
---

Add the first implementation of `@zipframes/schemas`:

- Shared event envelope and `zipframes.events` exchange name from the domain
  docs.
- Auth, video and processor-worker event contracts (`user.*`, `video.uploaded`,
  `video.processing.started`, `video.processed`, `video.failed`).
- HTTP request/response drafts for auth and video APIs, plus `parseSchema`
  returning `Result`.
- Subpath exports per publishing service.
