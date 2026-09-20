# @zipframes/communication

Publicação e consumo de eventos, com retry e DLQ, encapsulando o broker.

## O que é

- publisher com confirmação e envelope tipado (`@zipframes/schemas`)
- consumer com ack / retry / dead-letter e prefetch lógico
- retry com backoff e roteamento para a DLQ
- topologia padrão do exchange `zipframes.events`

## O que não é

- decisão sobre o que fazer com a mensagem (use case)
- schemas dos eventos (ficam em `@zipframes/schemas`)

## Uso

```ts
import {
  createDefaultTopology,
  createInMemoryBroker,
  createPublisher,
  createConsumer,
} from "@zipframes/communication";
import { EVENT_EXCHANGE } from "@zipframes/schemas/shared";

const broker = createInMemoryBroker();
await broker.assertTopology(
  createDefaultTopology({
    consumerQueues: [{ name: "processor.video.uploaded", routingKeys: ["video.uploaded"] }],
  }),
);

const publisher = createPublisher(broker);
await publisher.publish(envelope, {
  exchange: EVENT_EXCHANGE,
  routingKey: "video.uploaded",
});
```

O adapter RabbitMQ (amqplib) entra depois, atrás das mesmas interfaces. Os testes usam o broker in-memory.

## Status

Publisher, consumer, retry/DLQ e topologia implementados com cobertura 100%.
