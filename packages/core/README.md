# @zipframes/core

Tipos e utilitários de domínio sem dependência externa nenhuma.

## O que é

- `Result`, com `ok`, `err` e combinadores
- branded types
- erros base, separados por origem (`domain`, `application`, `infrastructure`) e os erros semânticos comuns a qualquer serviço

## Estrutura

```
src/branded
src/errors
src/result
test
```

Junto com `value-objects`, é o único pacote que a camada de domínio dos serviços pode importar.

## Import

O pacote pode ser importado inteiro ou por subcaminho, quando você quiser deixar explícito de onde vem cada coisa:

```ts
import { ok, err, DomainError } from "@zipframes/core";

import { ok, err } from "@zipframes/core/result";
import { DomainError } from "@zipframes/core/errors";
import { brand } from "@zipframes/core/branded";
```

As duas formas entregam a mesma implementação.

## Erros

| Classe              | Origem           | Quando                                              |
| ------------------- | ---------------- | --------------------------------------------------- |
| `ValidationError`   | `domain`         | Formato ou invariante violada                       |
| `NotFoundError`     | `application`    | O recurso não existe, ou não existe para quem pediu |
| `ConflictError`     | `application`    | Choque com o estado atual                           |
| `UnauthorizedError` | `application`    | Sem identidade válida                               |
| `ForbiddenError`    | `application`    | Identidade válida, sem permissão                    |
| `TimeoutError`      | `infrastructure` | Prazo estourado                                     |
| `UnavailableError`  | `infrastructure` | Dependência fora do ar                              |

Os erros de infraestrutura têm `retryable`, que por padrão é `true`. É por ele que o consumer decide entre reenfileirar a mensagem e mandá-la para a DLQ, sem inspecionar a classe.

Nada aqui conhece HTTP. Mapear um erro para status é trabalho do adapter, na camada de apresentação. Por isso não existe `InternalServerError`: uma falha inesperada é `InfrastructureError` ou uma exceção que ninguém tratou.
