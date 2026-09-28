# @zipframes/communication

Publicação e consumo de eventos, com retry e DLQ, encapsulando o broker.

## O que é

- publisher com confirmação e envelope tipado (`@zipframes/schemas`)
- `createNotifier`: métodos tipados (`videoProcessed`, `videoFailed`) que preenchem o envelope e publicam no `zipframes.events`
- consumer com ack / retry / dead-letter
- `defineMessageHandler`: valida o envelope, chama o handler com o evento tipado e decide ack / retry / dead-letter
- retry com backoff e roteamento para a DLQ
- topologia padrão do exchange `zipframes.events`

## O que não é

- decisão sobre o que fazer com a mensagem (use case)
- schemas dos eventos (ficam em `@zipframes/schemas`)
- SMTP / Nodemailer (ficam no notification-service)
- fila, bindings e retry do notification-service (ficam no próprio serviço)
- abrir a conexão com o broker (quem testa sobe RabbitMQ com `@zipframes/test-toolkit`)

## `defineMessageHandler`

O `BrokerMessage.envelope` chega sem validação (`unknown`). `defineMessageHandler` faz a borda da mensagem: valida, chama o handler com o evento tipado e liquida a mensagem.

```ts
const handler: ConsumeHandler = defineMessageHandler({
  schema: videoUploadedEventSchema,
  retry,
  handle: (event, { attempt }) => useCase.execute(toJob(event, attempt)),
  onExhausted: (event, error, { attempt }) => publishFailure(event, error, attempt),
  runInContext: (event, run) => runWithCorrelationId(event.correlationId, run),
  onOutcome: (outcome, { attempt, durationMs }) => observe(outcome, attempt, durationMs),
});
```

| Situação                           | O que acontece                    | `onOutcome.kind` |
| ---------------------------------- | --------------------------------- | ---------------- |
| Envelope não bate com a schema     | dead-letter, `handle` não roda    | `poison`         |
| `handle` resolve                   | ack                               | `handled`        |
| `handle` lança, restam tentativas  | retry                             | `retry`          |
| `handle` lança na última tentativa | `onExhausted`, depois dead-letter | `exhausted`      |

Se `onExhausted` lançar, o erro sobe sem liquidar a mensagem; o consumer do broker trata como falha da tentativa.

## `createNotifier`

O worker dispara o e-mail de resultado publicando `video.processed` e `video.failed`. Não usa Nodemailer. Eventos de identidade (`user.registered`, `user.updated`, `user.deleted`) não passam por este helper: o auth publica o envelope pelo `EventPublisher`.

```ts
const notifier = createNotifier(createPublisher(amqp));

await notifier.videoProcessed({
  correlationId,
  payload: { videoId, resultKey, frameCount, durationMs, ownerId, originalFileName },
});
```
