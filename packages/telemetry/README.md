# @zipframes/telemetry

Métricas Prometheus (via `prom-client`) com um conjunto pronto de métricas técnicas para HTTP e mensageria, e tracing OpenTelemetry com exportação OTLP e propagação de contexto W3C.

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
pnpm add @zipframes/telemetry @zipframes/core
```

O pacote é ESM.

## Métricas

```ts
import { createMetrics } from "@zipframes/telemetry";

const metrics = createMetrics({ service: "orders-api", version: "1.4.0" });

metrics.httpRequestsTotal.inc({ method: "GET", route: "/orders/:id", status: "200" });
metrics.httpRequestDurationSeconds.observe(
  { method: "GET", route: "/orders/:id", status: "200" },
  0.042,
);
metrics.messagesHandledTotal.inc({ destination: "billing.orders", outcome: "handled" });

// Endpoint de scrape:
app.get("/metrics", async (_req, res) => {
  res.type(metrics.registry.contentType).send(await metrics.registry.metrics());
});
```

| Métrica                         | Tipo      | Labels                      |
| ------------------------------- | --------- | --------------------------- |
| `http_requests_total`           | counter   | `method`, `route`, `status` |
| `http_request_duration_seconds` | histogram | `method`, `route`, `status` |
| `messages_handled_total`        | counter   | `destination`, `outcome`    |
| `message_duration_seconds`      | histogram | `destination`, `outcome`    |

Use o padrão da rota (`/orders/:id`) em `route`, e não o path real, para o número de séries não crescer a cada ID. Métricas de negócio você registra no mesmo `metrics.registry` com o `prom-client`.

| Opção             | Padrão        | Descrição                                   |
| ----------------- | ------------- | ------------------------------------------- |
| `service`         |               | Label `service` em todas as métricas        |
| `version`         |               | Label `version` em todas as métricas        |
| `register`        | registry novo | Um `Registry` do `prom-client` já existente |
| `collectDefaults` | `true`        | Coleta as métricas padrão do processo Node  |

## Tracing

```ts
import {
  initTracing,
  withSpan,
  injectMessageContext,
  extractMessageContext,
} from "@zipframes/telemetry";

const tracing = initTracing({
  service: "orders-api",
  version: "1.4.0",
  endpoint: "http://otel-collector:4318/v1/traces",
});

if (tracing.ok) {
  const { tracer, shutdown } = tracing.value;

  await withSpan(tracer, "charge-card", async (span) => {
    span.setAttribute("order.id", orderId);
    const headers: Record<string, string | undefined> = {};
    injectMessageContext(headers); // grava traceparent nos headers da mensagem
    await publish(event, { headers });
  });

  process.on("SIGTERM", () => void shutdown());
}
```

No consumidor, `extractMessageContext(message.headers)` devolve o contexto do produtor para continuar o mesmo trace. `injectHttpContext` e `extractHttpContext` fazem o mesmo com headers HTTP.

`withSpan` marca o span com status de erro e registra a exceção quando a função lança, e relança o erro.

Sem `endpoint` nem `exporter`, os spans são criados mas não são exportados. Em testes, passe um `exporter` em memória (`InMemorySpanExporter`) ou um `provider` próprio.

## API

| Export                                           | Descrição                                        |
| ------------------------------------------------ | ------------------------------------------------ |
| `createMetrics`                                  | Registry com as métricas técnicas                |
| `initTracing`                                    | Inicia o tracer; devolve `Result<TracingHandle>` |
| `withSpan`                                       | Executa uma função dentro de um span             |
| `injectContext` / `extractContext`               | Propagação W3C em um objeto de headers           |
| `injectHttpContext` / `extractHttpContext`       | Mesma função, nome para uso em HTTP              |
| `injectMessageContext` / `extractMessageContext` | Mesma função, nome para uso em mensagens         |
