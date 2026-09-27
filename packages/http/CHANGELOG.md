# @zipframes/http

## 0.2.1

### Patch Changes

- Updated dependencies [[`f5adac2`](https://github.com/zipframes/zipframes-packages/commit/f5adac2a4e8bb06ec5d097c2d9ff14df2fe8a436)]:
  - @zipframes/schemas@0.2.0

## 0.2.0

### Minor Changes

- [#41](https://github.com/zipframes/zipframes-packages/pull/41) [`384a2c9`](https://github.com/zipframes/zipframes-packages/commit/384a2c9723247b61ee686285a76d87b5f1491b17) Thanks [@knzt](https://github.com/knzt)! - Primeira versão de `@zipframes/http`:

  - `defineHandler`: pipeline de Bearer JWT opcional, validação Zod de entrada e saída,
    `Result` ou valor cru no handler, e respostas problem+json via `@zipframes/core`.
  - Tipos `HttpRequest`, `HttpReply`, `HandlerContext` e `AuthenticatedHandlerContext`.
  - `errorHelper` customizável; default usa `statusCode` e `message` de `BaseError`.
