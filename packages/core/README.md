# @zipframes/core

Tipos e utilitários de domínio sem dependência externa nenhuma.

## O que é

- `Result`, com `ok`, `err` e combinadores
- branded types
- erros base, separados por origem (`domain`, `application`, `infrastructure`) e os erros semânticos comuns a qualquer serviço
- readiness (`Pingable`, `createReadinessCheck`)
- o envelope HTTP de Problem Details (`problemDetails`, `problemResponse`)

## Estrutura

```
src/branded
src/errors
src/http
src/readiness
src/result
test
```

`result`, `branded` e `errors` são o que a camada de domínio pode importar, junto com `value-objects`. `readiness` e `http` ficam na borda.

## Import

O pacote pode ser importado inteiro ou por subcaminho, quando você quiser deixar explícito de onde vem cada coisa:

```ts
import { ok, err, DomainError } from "@zipframes/core";

import { ok, err } from "@zipframes/core/result";
import { DomainError } from "@zipframes/core/errors";
import { brand } from "@zipframes/core/branded";
import { problemResponse } from "@zipframes/core/http";
import { createReadinessCheck } from "@zipframes/core/readiness";
```

As duas formas entregam a mesma implementação.

## Erros

| Classe                | Origem           | Quando                                              |
| --------------------- | ---------------- | --------------------------------------------------- |
| `ValidationError`     | `domain`         | Formato ou invariante violada                       |
| `NotFoundError`       | `application`    | O recurso não existe, ou não existe para quem pediu |
| `ConflictError`       | `application`    | Choque com o estado atual                           |
| `UnauthorizedError`   | `application`    | Sem identidade válida                               |
| `ForbiddenError`      | `application`    | Identidade válida, sem permissão                    |
| `TimeoutError`        | `infrastructure` | Prazo estourado                                     |
| `UnavailableError`    | `infrastructure` | Dependência fora do ar                              |
| `InternalServerError` | `infrastructure` | Falha inesperada no serviço ou em dependência       |

Cada classe traz `statusCode` (número HTTP). Os padrões são:

| Classe / origem        | `statusCode` |
| ---------------------- | ------------ |
| `DomainError`          | 400          |
| `ApplicationError`     | 400          |
| `InfrastructureError`  | 500          |
| `ValidationError`      | 400          |
| `UnauthorizedError`    | 401          |
| `ForbiddenError`       | 403          |
| `NotFoundError`        | 404          |
| `ConflictError`        | 409          |
| `InternalServerError`  | 500          |
| `UnavailableError`     | 503          |
| `TimeoutError`         | 504          |

O adapter HTTP lê `error.statusCode` em vez de montar tabelas `instanceof`. `toJSON()` inclui o status. `http/` empacota um envelope RFC 9457 (`problemDetails`, `problemResponse`) a partir do status já escolhido.

Os erros de infraestrutura têm `retryable`. Em `TimeoutError` e `UnavailableError` o padrão é `true`; em `InternalServerError` é `false`. É por `retryable` que o consumer decide entre reenfileirar a mensagem e mandá-la para a DLQ, sem inspecionar a classe.
