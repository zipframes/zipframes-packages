# @zipframes/http

Handlers HTTP independentes de framework. Um handler valida a entrada com Zod, chama sua função, valida a saída e devolve um `HttpReply` (status, content type e corpo). Erros viram `application/problem+json`.

O adapter do seu framework (Fastify, Express, Lambda) só converte a requisição em `HttpRequest` e escreve o `HttpReply` de volta.

## Instalação

Os pacotes `@zipframes/*` são publicados no GitHub Packages. No `.npmrc` do projeto:

```
@zipframes:registry=https://npm.pkg.github.com
```

O GitHub Packages exige um token com `read:packages` mesmo para pacotes públicos. No `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=<seu token>
```

```bash
pnpm add @zipframes/http @zipframes/core zod
```

O pacote é ESM.

## Uso

### Rota pública

```ts
import { defineHandler } from "@zipframes/http";
import { ok, err } from "@zipframes/core/result";
import { ConflictError } from "@zipframes/core/errors";
import { z } from "zod";

export const register = defineHandler({
  inputSchema: z.object({ email: z.email(), password: z.string().min(8) }),
  outputSchema: z.object({ userId: z.uuid() }),
  successStatus: 201,
  handler: async (input) => {
    if (await users.exists(input.email)) {
      return err(new ConflictError("EMAIL_TAKEN", "email already registered"));
    }
    return ok({ userId: await users.create(input) });
  },
});

// No adapter do framework:
const reply = await register({ body: req.body, correlationId });
res
  .status(reply.status)
  .type(reply.contentType ?? "application/json")
  .send(reply.body);
```

A entrada inválida responde 400. Um `err(...)` responde com o `statusCode` do erro. Uma exceção não tratada, ou uma saída que não bate com `outputSchema`, responde 500 sem expor a mensagem interna.

### Rota autenticada

`defineAuthenticatedHandler` lê o header `Authorization: Bearer <token>` do `HttpRequest`, verifica o token com um `Authenticator` de `@zipframes/authenticator` e só então valida a entrada. As claims chegam no contexto:

```ts
import { createAuthenticator } from "@zipframes/authenticator";
import { defineAuthenticatedHandler } from "@zipframes/http";

const authenticator = createAuthenticator({ jwks: { url: jwksUrl }, issuer, audience });

export const listOrders = defineAuthenticatedHandler({
  authenticator,
  inputSchema: z.object({}),
  outputSchema: z.array(z.object({ id: z.string() })),
  successStatus: 200,
  handler: async (_input, ctx) => ok(await orders.byOwner(ctx.claims.sub)),
});

const reply = await listOrders({
  body: {},
  correlationId,
  authorization: req.headers.authorization,
});
```

Sem token ou com token inválido, a resposta é 401 antes de qualquer validação da entrada.

### Tratamento de erro próprio

`errorHelper` substitui a tradução padrão de erro para resposta. Útil quando duas falhas diferentes precisam da mesma resposta, como no login:

```ts
import { problemResponse } from "@zipframes/core/http";

export const login = defineHandler({
  inputSchema,
  outputSchema,
  successStatus: 200,
  errorHelper: (_error, ctx) => problemResponse(401, "Unauthorized", undefined, ctx.correlationId),
  handler: (input) => authenticate(input),
});
```

## API

| Export                       | Descrição                                                  |
| ---------------------------- | ---------------------------------------------------------- |
| `defineHandler`              | Cria um handler sem autenticação                           |
| `defineAuthenticatedHandler` | Cria um handler que exige um JWT válido                    |
| `HttpRequest`                | `{ body, correlationId, authorization? }`                  |
| `HttpReply`                  | `{ status, body, contentType? }`                           |
| `ErrorHelper`                | `(error, ctx) => HttpReply`, para trocar a tradução padrão |
