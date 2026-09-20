# @zipframes/authenticator

Validação de JWT via JWKS.

## O que é

- busca e cache das chaves públicas publicadas pelo auth-service
- verificação de assinatura, emissor, audiência e expiração
- extração das claims para o contexto da requisição

## O que não é

- emissão de tokens, que pertence ao auth-service
- autorização por regra de negócio, como "só o dono vê o vídeo"

## Uso

```ts
import { createAuthenticator } from "@zipframes/authenticator";
import { isOk } from "@zipframes/core/result";

const authenticator = createAuthenticator({
  jwks: { url: "https://auth.example/.well-known/jwks.json" },
  issuer: "https://auth.example",
  audience: "video-service",
});

const result = await authenticator.verify(bearerToken);
if (isOk(result)) {
  // result.value.sub is the authenticated user id
}
```
