# @zipframes/authenticator

## 0.1.0

### Minor Changes

- [#16](https://github.com/zipframes/zipframes-packages/pull/16) [`3b93db9`](https://github.com/zipframes/zipframes-packages/commit/3b93db95d53f9021f450a27a22486e56e80c8467) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/authenticator`:

  - `createJwksClient`: fetches and caches the public keys published by
    auth-service.
  - `createAuthenticator` / `createAuthenticatorFromKey`: verifies JWT
    signature, issuer, audience and expiry, returning `Result` with the claims
    or an `UnauthorizedError`.
  - Default algorithm RS256; does not issue tokens and does not authorize.
