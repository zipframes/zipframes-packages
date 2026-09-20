# @zipframes/communication

Publicação e consumo de eventos, com retry e DLQ, encapsulando o broker.

## O que é

- publisher com confirmação e envelope tipado (`@zipframes/schemas`)
- consumer com ack / retry / dead-letter
- retry com backoff e roteamento para a DLQ
- topologia padrão do exchange `zipframes.events`

## O que não é

- decisão sobre o que fazer com a mensagem (use case)
- schemas dos eventos (ficam em `@zipframes/schemas`)
- broker in-memory de teste (fica em `@zipframes/test-toolkit`)
