# @zipframes/test-toolkit

Sobe PostgreSQL, RabbitMQ, Redis e um storage compatível com S3 (SeaweedFS) em containers descartáveis, com [Testcontainers](https://testcontainers.com), para testes de integração. Cada função devolve o endereço de conexão e um `stop`.

Precisa de Docker na máquina ou no CI.

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
pnpm add -D @zipframes/test-toolkit
```

O pacote é ESM e é só para testes.

## Uso

Com Vitest:

```ts
import { afterAll, beforeAll, it } from "vitest";
import {
  startPostgres,
  startRabbitMq,
  type PostgresHandle,
  type RabbitMqHandle,
} from "@zipframes/test-toolkit";

let postgres: PostgresHandle;
let rabbit: RabbitMqHandle;

beforeAll(async () => {
  [postgres, rabbit] = await Promise.all([startPostgres(), startRabbitMq()]);
  process.env.DATABASE_URL = postgres.connectionUri;
  process.env.AMQP_URL = rabbit.amqpUri;
}, 120_000);

afterAll(async () => {
  await Promise.all([postgres.stop(), rabbit.stop()]);
});

it("persists an order", async () => {
  // ...
});
```

O primeiro uso baixa as imagens, por isso o timeout maior no `beforeAll`.

## Containers

| Função          | Imagem                            | Devolve                                        |
| --------------- | --------------------------------- | ---------------------------------------------- |
| `startPostgres` | `postgres:16-alpine`              | `connectionUri`                                |
| `startRabbitMq` | `rabbitmq:3.13-management-alpine` | `amqpUri`                                      |
| `startRedis`    | `redis:7-alpine`                  | `url`                                          |
| `startS3`       | `chrislusf/seaweedfs:3.80`        | `endpoint`, `accessKey`, `secretKey`, `region` |

Todos os handles também expõem `container` (o container do Testcontainers) e `stop()`. `startS3` aceita outra imagem como argumento. Com o `@aws-sdk/client-s3`, use `forcePathStyle: true`. Nenhum bucket é criado: o teste cria o que precisa.
