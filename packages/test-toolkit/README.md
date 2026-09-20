# @zipframes/test-toolkit

Base para os testes de integração dos serviços.

## O que é

- containers prontos de PostgreSQL, RabbitMQ, Redis e storage S3-compatível (MinIO)
- `createInMemoryBroker` para testes unitários das portas de `@zipframes/communication`
- helpers de ciclo de vida (`start` / `stop`)

## O que não é

- fixtures de domínio de um serviço
- qualquer coisa usada em tempo de execução

## Uso

```ts
import { startPostgres, startRabbitMq, createInMemoryBroker } from "@zipframes/test-toolkit";
import { createPublisher, createDefaultTopology } from "@zipframes/communication";

const postgres = await startPostgres();
const broker = createInMemoryBroker();
await broker.assertTopology(createDefaultTopology({ consumerQueues: [] }));
const publisher = createPublisher(broker);
```

Sempre declarado como `devDependency` nos serviços.
