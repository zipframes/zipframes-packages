# @zipframes/telemetry

Métricas Prometheus e tracing OpenTelemetry.

## O que é

- registro de métricas e helpers para as métricas técnicas comuns
- inicialização do OpenTelemetry
- propagação do contexto W3C em HTTP e nas mensagens

## O que não é

- métricas de negócio específicas de um serviço, que são definidas nele
- logs, que vivem em `@zipframes/logger`

Separado do `logger` porque traz um SDK pesado e nem todo serviço precisa dele desde o começo.

## Uso

```ts
import { createMetrics, initTracing, withSpan } from "@zipframes/telemetry";
import { isOk } from "@zipframes/core/result";

const metrics = createMetrics({ service: "video-service", version: "1.0.0" });
const tracing = initTracing({ service: "video-service", version: "1.0.0" });

if (isOk(tracing)) {
  await withSpan(tracing.value.tracer, "list-videos", async () => {
    metrics.httpRequestsTotal.inc({ method: "GET", route: "/videos", status: "200" });
  });
}
```
