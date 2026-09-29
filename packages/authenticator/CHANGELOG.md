# @zipframes/authenticator

## 0.2.0

### Minor Changes

- [#55](https://github.com/zipframes/zipframes-packages/pull/55) [`b709077`](https://github.com/zipframes/zipframes-packages/commit/b709077d8d7597742fc5601c66a2d7dce5343238) Thanks [@knzt](https://github.com/knzt)! - - feat(authenticator): verify against a JWK already in memory, with `createAuthenticatorFromJwk`

## 0.1.4

### Patch Changes

- Updated dependencies [[`ec14344`](https://github.com/zipframes/zipframes-packages/commit/ec1434463e4d8f9d5bead547df76b6589ba72821)]:
  - @zipframes/core@0.5.0

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

- [#16](https://github.com/zipframes/zipframes-packages/pull/16) [`3b93db9`](https://github.com/zipframes/zipframes-packages/commit/3b93db95d53f9021f450a27a22486e56e80c8467) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/authenticator`:

  - `createJwksClient`: fetches and caches the public keys published by
    auth-service.
  - `createAuthenticator` / `createAuthenticatorFromKey`: verifies JWT
    signature, issuer, audience and expiry, returning `Result` with the claims
    or an `UnauthorizedError`.
  - Default algorithm RS256; does not issue tokens and does not authorize.
