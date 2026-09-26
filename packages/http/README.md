# @zipframes/http

`defineHandler` e `defineAuthenticatedHandler` para controllers HTTP sem Fastify, AWS ou middy.

## O que é

- validação de entrada e saída com Zod (mesmo contrato de `parseSchema`)
- autenticação JWT via `@zipframes/authenticator` quando a rota exige (`defineAuthenticatedHandler`)
- respostas de sucesso e problem+json usando `@zipframes/core`
- `handler` devolve `Result` de `@zipframes/core`

## Uso

Rotas públicas (sem JWT):

```ts
import { defineHandler } from "@zipframes/http";
import { ok } from "@zipframes/core/result";
import { z } from "zod";

const inputSchema = z.object({ email: z.email() });
const outputSchema = z.object({ id: z.string() });

export const register = defineHandler({
  inputSchema,
  outputSchema,
  successStatus: 201,
  handler: async (input) => ok({ id: "user-1", email: input.email }),
});
```

Rotas autenticadas (`ctx.claims`, `sub` = user id):

```ts
import { createAuthenticator } from "@zipframes/authenticator";
import { defineAuthenticatedHandler } from "@zipframes/http";
import { ok } from "@zipframes/core/result";

export const listVideos = defineAuthenticatedHandler({
  inputSchema: z.object({}),
  outputSchema: z.array(z.object({ id: z.string() })),
  successStatus: 200,
  authenticator,
  handler: async (_input, ctx) => ok([{ id: "v1", ownerId: ctx.claims.sub }]),
});
```

O adapter HTTP (Fastify, Lambda, etc.) só encaminha o `HttpReply` retornado.
