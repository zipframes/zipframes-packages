---
"@zipframes/communication": minor
---

Adiciona `defineMessageHandler`, o equivalente do `defineHandler` de `@zipframes/http` para mensagens:

- valida o envelope com a schema do evento e entrega o evento tipado ao `handle`;
- envelope inválido (poison) vai para a dead-letter sem chamar o `handle`;
- sucesso faz ack; erro agenda nova tentativa enquanto `decideRetry` permitir e, na última, chama `onExhausted` antes da dead-letter;
- `runInContext` envolve o tratamento do evento validado (ex.: correlation id) e `onOutcome` informa o desfecho para log e métricas.

**Breaking:** `BrokerMessage.envelope` passa a ser `unknown` e `BrokerMessage` perde o parâmetro genérico. O envelope que chega do broker ainda não foi validado; quem precisa do evento tipado usa `defineMessageHandler` (ou `parseSchema`).
