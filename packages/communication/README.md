# @zipframes/communication

Publicação e consumo de eventos com retry, backoff exponencial e dead-letter, sem depender de um cliente de broker específico. Você liga o pacote ao seu cliente (amqplib, por exemplo) por duas interfaces pequenas, e ele cuida da validação do envelope e da decisão entre ack, nova tentativa e DLQ.

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
pnpm add @zipframes/communication @zipframes/schemas zod
```

O pacote é ESM.

## Uso

### Consumir uma mensagem

`defineMessageHandler` recebe a mensagem como chegou do broker, valida o envelope com um schema Zod e chama `handle` com o evento já tipado. O resultado decide o que acontece com a mensagem:

```ts
import { defineMessageHandler } from "@zipframes/communication";
import { videoUploadedEventSchema } from "@zipframes/schemas/video-service";

const handler = defineMessageHandler({
  schema: videoUploadedEventSchema,
  retry: { maxAttempts: 5, baseDelayMs: 1_000, maxDelayMs: 30_000 },
  handle: async (event, { attempt }) => processVideo(event.payload, attempt),
  onExhausted: async (event, error) => publishFailure(event, error),
  runInContext: (event, run) => runWithCorrelationId(event.correlationId, run),
  onOutcome: (outcome, { attempt, durationMs }) => metrics.observe(outcome.kind, durationMs),
});

// No adaptador do seu broker, para cada mensagem recebida:
await handler(
  { envelope: JSON.parse(msg.content.toString()), headers, routingKey },
  { attempt, redelivered, ack, retry, deadLetter },
);
```

| Situação                            | Resultado                         | `outcome.kind` |
| ----------------------------------- | --------------------------------- | -------------- |
| O envelope não bate com o schema    | dead-letter, `handle` não roda    | `poison`       |
| `handle` resolve                    | ack                               | `handled`      |
| `handle` lança e ainda há tentativa | retry                             | `retry`        |
| `handle` lança na última tentativa  | `onExhausted`, depois dead-letter | `exhausted`    |

Se `onExhausted` lançar, a mensagem não é liquidada e o erro sobe para o adaptador tratar como falha da tentativa.

`ack`, `retry` e `deadLetter` são as operações do seu broker. Com RabbitMQ, `retry` costuma republicar numa fila de espera com TTL e incrementar o header `x-attempt`, e `deadLetter` faz `nack` sem requeue para a fila ter uma dead-letter exchange configurada.

### Publicar

`createPublisher` envolve qualquer objeto com um método `publish(envelope, options)`:

```ts
import { createPublisher } from "@zipframes/communication";
import { EVENT_EXCHANGE } from "@zipframes/schemas";

const publisher = createPublisher({
  publish: async (envelope, { exchange, routingKey, headers }) => {
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(envelope)), {
      persistent: true,
      headers,
    });
    await channel.waitForConfirms();
  },
});

await publisher.publish(
  {
    eventId: randomUUID(),
    eventType: "user.registered",
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId,
    payload: { userId, email, name },
  },
  { exchange: EVENT_EXCHANGE, routingKey: "user.registered" },
);
```

`createNotifierEmailHelper(publisher)` é um atalho tipado que monta o envelope de `video.processed` e `video.failed`.

### Retry e topologia

`computeBackoffMs(attempt, retry)` calcula a espera de uma tentativa (exponencial, limitada por `maxDelayMs`) e `decideRetry(attempt, retry)` diz se ainda cabe outra tentativa (`"retry"`) ou se a mensagem vai para a DLQ (`"dlq"`).

`createDefaultTopology` descreve exchanges, filas e bindings como dados, para o adaptador declarar no broker:

```ts
import { createDefaultTopology } from "@zipframes/communication";

const topology = createDefaultTopology({
  consumerQueues: [{ name: "billing.orders", routingKeys: ["order.placed"] }],
});
// exchanges: zipframes.events (topic) e zipframes.events.dlx
// filas: billing.orders (com DLX) e zipframes.events.dlq
```

`createConsumer` é um consumidor de referência sobre uma fila em memória, usado para testar handlers sem broker.

## API

| Export                      | Descrição                                                      |
| --------------------------- | -------------------------------------------------------------- |
| `defineMessageHandler`      | Borda de consumo: valida, chama e liquida a mensagem           |
| `createPublisher`           | Publisher sobre qualquer `PublishPort`                         |
| `createNotifierEmailHelper` | Publica `video.processed` e `video.failed` com envelope pronto |
| `computeBackoffMs`          | Espera da próxima tentativa                                    |
| `decideRetry`               | `"retry"` ou `"dlq"` para uma tentativa                        |
| `createDefaultTopology`     | Exchanges, filas e bindings padrão                             |
| `createConsumer`            | Consumidor sobre uma `MessageQueue`, para testes               |
