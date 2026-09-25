# @zipframes/test-toolkit

Base para os testes de integração dos serviços.

## O que é

- containers prontos de PostgreSQL, RabbitMQ, Redis e storage S3-compatível (SeaweedFS)
- helpers de ciclo de vida (`start` / `stop`)

## O que não é

- fixtures de domínio de um serviço
- qualquer coisa usada em tempo de execução

## Uso

```ts
import { startPostgres, startRabbitMq } from "@zipframes/test-toolkit";

const postgres = await startPostgres();
const rabbit = await startRabbitMq();

await postgres.stop();
await rabbit.stop();
```

Sempre declarado como `devDependency` nos serviços.
