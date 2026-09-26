# @zipframes/http

`defineHandler` para controllers HTTP sem Fastify, AWS ou middy.

## O que é

- validação de entrada e saída com Zod (mesmo contrato de `parseSchema`)
- autenticação opcional via `@zipframes/authenticator` (Bearer JWT)
- respostas de sucesso e problem+json usando `@zipframes/core`
- `handler` pode devolver `Result` ou o valor cru

## Uso

```ts
import { defineHandler } from "@zipframes/http";
import { z } from "zod";

const inputSchema = z.object({ email: z.email() });
const outputSchema = z.object({ id: z.string() });

export const register = defineHandler({
  inputSchema,
  outputSchema,
  successStatus: 201,
  handler: async (input, ctx) => ({
    id: "user-1",
    email: input.email,
  }),
});
```

Com authenticator, o handler recebe `ctx.claims` (`VerifiedClaims`, `sub` = user id):

```ts
import { createAuthenticator } from "@zipframes/authenticator";

export const listVideos = defineHandler({
  inputSchema: z.object({}),
  outputSchema: z.array(z.object({ id: z.string() })),
  successStatus: 200,
  authenticator,
  handler: async (_input, ctx) => [{ id: "v1", ownerId: ctx.claims.sub }],
});
```

O adapter HTTP (Fastify, Lambda, etc.) só encaminha o `HttpReply` retornado.
