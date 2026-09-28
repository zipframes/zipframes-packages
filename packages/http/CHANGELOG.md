# @zipframes/http

## 0.2.2

### Patch Changes

- Updated dependencies [[`ec14344`](https://github.com/zipframes/zipframes-packages/commit/ec1434463e4d8f9d5bead547df76b6589ba72821), [`ebd6273`](https://github.com/zipframes/zipframes-packages/commit/ebd62732dd8b4d684f8eb130be4317117f3fde4b)]:
  - @zipframes/core@0.5.0
  - @zipframes/schemas@1.0.0
  - @zipframes/authenticator@0.1.4

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
