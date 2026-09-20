---
"@zipframes/authenticator": minor
---

Add the first implementation of `@zipframes/authenticator`:

- `createJwksClient`: fetches and caches the public keys published by
  auth-service.
- `createAuthenticator` / `createAuthenticatorFromKey`: verifies JWT
  signature, issuer, audience and expiry, returning `Result` with the claims
  or an `UnauthorizedError`.
- Default algorithm RS256; does not issue tokens and does not authorize.
