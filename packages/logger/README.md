# @zipframes/logger

Logs estruturados em JSON com correlation ID.

## O que é

- logger estruturado, com serviço, versão e nível
- propagação de `correlationId` entre requisições e mensagens
- redação de campos sensíveis

É dependência de todo serviço desde o primeiro dia, então é deliberadamente leve.

## Uso

```ts
import { createLogger, createCorrelationId, runWithCorrelationId } from "@zipframes/logger";

const logger = createLogger({
  service: "auth-service",
  version: "1.0.0",
  level: "info",
});

runWithCorrelationId(createCorrelationId(), () => {
  logger.info("request started", { path: "/login" });
});
```

`createLogger` sempre emite `service` e `version`. Quando um `correlationId` está no contexto assíncrono, ele entra em toda linha. Campos como `password`, `token` e `secret` saem como `[Redacted]`.

## Status

Logger JSON com correlation ID e redação implementados, com cobertura de testes de 100%.

Não depende de `@zipframes/core`: o pacote é só infraestrutura de logging.
