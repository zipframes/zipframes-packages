# @zipframes/core

`Result`, branded types, uma hierarquia de erros com status HTTP e utilitários de readiness e de Problem Details. Não tem nenhuma dependência de runtime.

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
pnpm add @zipframes/core
```

O pacote é ESM.

## Uso

### Result

Uma função que pode falhar devolve `Result<T, E>` em vez de lançar:

```ts
import { ok, err, isOk, map, type Result } from "@zipframes/core/result";
import { ValidationError } from "@zipframes/core/errors";

const parseAge = (raw: string): Result<number, ValidationError> => {
  const age = Number(raw);
  return Number.isInteger(age) && age >= 0
    ? ok(age)
    : err(new ValidationError("INVALID_AGE", "age must be a non-negative integer"));
};

const result = map(parseAge("42"), (age) => age + 1);
if (isOk(result)) {
  console.log(result.value); // 43
} else {
  console.log(result.error.code);
}
```

Também existem `mapErr`, `andThen`, `unwrapOr`, `unwrapOrElse`, `match` e `all`.

### Branded types

```ts
import { brand, type Brand } from "@zipframes/core/branded";

type UserId = Brand<string, "UserId">;

const userId = brand<UserId>("5f0c...");
// Uma string comum não é aceita onde se espera UserId.
```

### Erros

Todo erro tem `code`, `message` e `statusCode`. Quem responde HTTP lê `error.statusCode` em vez de testar a classe:

```ts
import { NotFoundError, UnavailableError, isRetryableError } from "@zipframes/core/errors";

const notFound = new NotFoundError("VIDEO_NOT_FOUND", "video not found");
notFound.statusCode; // 404

const down = new UnavailableError("DB_DOWN", "database unreachable", { cause });
isRetryableError(down); // true
```

| Classe                | Base                  | `statusCode` | `retryable` |
| --------------------- | --------------------- | ------------ | ----------- |
| `ValidationError`     | `DomainError`         | 400          |             |
| `UnauthorizedError`   | `ApplicationError`    | 401          |             |
| `ForbiddenError`      | `ApplicationError`    | 403          |             |
| `NotFoundError`       | `ApplicationError`    | 404          |             |
| `ConflictError`       | `ApplicationError`    | 409          |             |
| `InternalServerError` | `InfrastructureError` | 500          | `false`     |
| `UnavailableError`    | `InfrastructureError` | 503          | `true`      |
| `TimeoutError`        | `InfrastructureError` | 504          | `true`      |

`DomainError` e `ApplicationError` usam 400 por padrão e `InfrastructureError` usa 500. `retryable` só existe nos erros de infraestrutura e pode ser sobrescrito no construtor (`{ retryable: false }`). `isRetryableError` devolve `false` para erros de domínio e de aplicação e `true` para qualquer erro que não seja um `BaseError`, porque uma falha desconhecida numa fila costuma valer uma nova tentativa.

### Readiness

Qualquer dependência que implemente `Pingable` entra na checagem, na ordem dada. A primeira falha vira o `reason`:

```ts
import { createReadinessCheck, type Pingable } from "@zipframes/core/readiness";

const database: Pingable = { ping: () => prisma.$queryRaw`SELECT 1`.then(() => undefined) };
const broker: Pingable = { ping: () => channel.checkExchange("events").then(() => undefined) };

const checkReadiness = createReadinessCheck([database, broker]);
const { ready, reason } = await checkReadiness();
```

### Problem Details (RFC 9457)

```ts
import { problemResponse } from "@zipframes/core/http";

const reply = problemResponse(404, "Not Found", "video not found", correlationId);
// { status: 404, contentType: "application/problem+json", body: { type, title, status, detail, correlationId } }
```

`problemDetailsJsonSchema` e `problemDetailsSchema(description)` descrevem esse corpo para OpenAPI.

## Subcaminhos

Tudo sai também da raiz (`@zipframes/core`). Os subcaminhos existem para deixar explícito de onde cada coisa vem:

| Subcaminho                  | Conteúdo                                                |
| --------------------------- | ------------------------------------------------------- |
| `@zipframes/core/result`    | `Result`, `ok`, `err` e combinadores                    |
| `@zipframes/core/branded`   | `Brand`, `Unbrand`, `brand`                             |
| `@zipframes/core/errors`    | Classes de erro, `isBaseError`, `isRetryableError`      |
| `@zipframes/core/readiness` | `Pingable`, `createReadinessCheck`                      |
| `@zipframes/core/http`      | `problemDetails`, `problemResponse` e o schema do corpo |
