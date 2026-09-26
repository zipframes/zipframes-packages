---
"@zipframes/http": minor
---

Primeira versão de `@zipframes/http`:

- `defineHandler`: pipeline de Bearer JWT opcional, validação Zod de entrada e saída,
  `Result` ou valor cru no handler, e respostas problem+json via `@zipframes/core`.
- Tipos `HttpRequest`, `HttpReply`, `HandlerContext` e `AuthenticatedHandlerContext`.
- `errorHelper` customizável; default usa `statusCode` e `message` de `BaseError`.
