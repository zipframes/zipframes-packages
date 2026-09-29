# @zipframes/logger

Logger JSON (sobre o [pino](https://getpino.io)) que carimba toda linha com serviço e versão, propaga um correlation ID pelo contexto assíncrono e oculta campos sensíveis.

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
pnpm add @zipframes/logger
```

O pacote é ESM.

## Uso

```ts
import { createLogger, createCorrelationId, runWithCorrelationId } from "@zipframes/logger";

const logger = createLogger({ service: "orders-api", version: "1.4.0", level: "info" });

runWithCorrelationId(createCorrelationId(), async () => {
  logger.info("order received", { orderId, password: "secret" });
  await chargeCard(); // qualquer log dentro desta chamada leva o mesmo correlationId
});
```

```json
{
  "level": 30,
  "time": "2026-09-29T12:00:00.000Z",
  "service": "orders-api",
  "version": "1.4.0",
  "correlationId": "8f1c…",
  "orderId": "42",
  "password": "[Redacted]",
  "msg": "order received"
}
```

Numa API HTTP, chame `runWithCorrelationId` no início da requisição com o ID recebido no header (ou um novo). Num consumidor de fila, use o `correlationId` que veio no envelope do evento. `getCorrelationId()` devolve o ID atual, para repassar a outra chamada.

`logger.child({ orderId })` cria um logger que inclui esses campos em toda linha.

## Opções

| Opção         | Padrão | Descrição                                                    |
| ------------- | ------ | ------------------------------------------------------------ |
| `service`     |        | Nome do serviço, presente em toda linha                      |
| `version`     |        | Versão do serviço, presente em toda linha                    |
| `level`       | `info` | `debug`, `info`, `warn` ou `error`                           |
| `redact`      | abaixo | Caminhos a ocultar; substitui a lista padrão                 |
| `destination` | stdout | Stream de saída do pino, útil para capturar os logs em teste |

Sem `redact`, saem como `[Redacted]` os campos `password`, `token`, `secret`, `authorization`, `accessToken` e `refreshToken`, e também `password`, `token` e `secret` um nível abaixo (`*.password`). Para acrescentar um campo, repita a lista padrão junto com o novo. O nível sai no formato numérico do pino (30 é `info`) e `time` em ISO 8601.

## API

| Export                 | Descrição                                            |
| ---------------------- | ---------------------------------------------------- |
| `createLogger`         | Cria o logger                                        |
| `runWithCorrelationId` | Executa uma função com um correlation ID no contexto |
| `getCorrelationId`     | Lê o correlation ID do contexto atual                |
| `createCorrelationId`  | Gera um novo ID (UUID)                               |
| `LOG_LEVELS`           | Os níveis aceitos                                    |
