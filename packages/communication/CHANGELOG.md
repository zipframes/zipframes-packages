# @zipframes/communication

## 0.2.1

### Patch Changes

- Updated dependencies [[`f5adac2`](https://github.com/zipframes/zipframes-packages/commit/f5adac2a4e8bb06ec5d097c2d9ff14df2fe8a436)]:
  - @zipframes/schemas@0.2.0

## 0.2.0

### Minor Changes

- [#43](https://github.com/zipframes/zipframes-packages/pull/43) [`e876bc5`](https://github.com/zipframes/zipframes-packages/commit/e876bc5cbc4199d7559ccdc10853272593f6c723) Thanks [@knzt](https://github.com/knzt)! - Adiciona `defineMessageHandler`, o equivalente do `defineHandler` de `@zipframes/http` para mensagens:

  - valida o envelope com a schema do evento e entrega o evento tipado ao `handle`;
  - envelope inválido (poison) vai para a dead-letter sem chamar o `handle`;
  - sucesso faz ack; erro agenda nova tentativa enquanto `decideRetry` permitir e, na última, chama `onExhausted` antes da dead-letter;
  - `runInContext` envolve o tratamento do evento validado (ex.: correlation id) e `onOutcome` informa o desfecho para log e métricas.

  **Breaking:** `BrokerMessage.envelope` passa a ser `unknown` e `BrokerMessage` perde o parâmetro genérico. O envelope que chega do broker ainda não foi validado; quem precisa do evento tipado usa `defineMessageHandler` (ou `parseSchema`).

## 0.1.3

### Patch Changes

- [#37](https://github.com/zipframes/zipframes-packages/pull/37) [`80328bf`](https://github.com/zipframes/zipframes-packages/commit/80328bf6949123200da15930cfd327056d5ba674) Thanks [@knzt](https://github.com/knzt)! - - fix(communication): drop the unused dependency on core

## 0.1.2

### Patch Changes

- Updated dependencies [[`47e71c0`](https://github.com/zipframes/zipframes-packages/commit/47e71c0a4bff6ecceb0029311c686364dacdbe48)]:
  - @zipframes/core@0.3.0
  - @zipframes/schemas@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [[`663e368`](https://github.com/zipframes/zipframes-packages/commit/663e3688358011e52f6cb4e0f39b6bebf05e0150)]:
  - @zipframes/core@0.2.0
  - @zipframes/schemas@0.1.1

## 0.1.0

### Minor Changes

- [#22](https://github.com/zipframes/zipframes-packages/pull/22) [`aec85ab`](https://github.com/zipframes/zipframes-packages/commit/aec85abcdea707217e3ad5aa38a5e9bc3d6d23c2) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/communication`:

  - Publisher/consumer ports over a queue abstraction, using the shared event
    envelope from `@zipframes/schemas`.
  - Retry helpers (exponential backoff and DLQ decision) and the default
    `zipframes.events` topology with per-consumer queues and a shared DLQ.
  - Consumer settlement API: ack, retry and deadLetter.

  The in-memory broker used in tests lives in `@zipframes/test-toolkit`.
