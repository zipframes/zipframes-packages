# @zipframes/schemas

Schemas Zod dos contratos do ZipFrames: o envelope comum dos eventos, o payload de cada evento e as requisições e respostas das APIs HTTP. Os tipos TypeScript saem dos próprios schemas, então validação e tipo não divergem.

Os contratos estão agrupados pelo serviço que os publica. Um consumidor importa do publicador do evento que consome.

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
pnpm add @zipframes/schemas zod
```

O pacote é ESM.

## Uso

### Validar um evento recebido

```ts
import { parseSchema } from "@zipframes/schemas";
import {
  videoUploadedEventSchema,
  type VideoUploadedEvent,
} from "@zipframes/schemas/video-service";

const result = parseSchema(videoUploadedEventSchema, JSON.parse(raw));

if (result.ok) {
  const event: VideoUploadedEvent = result.value;
  console.log(event.payload.videoId);
} else {
  // ValidationError com as issues do Zod em error.details.issues
}
```

`parseSchema` funciona com qualquer schema Zod e devolve `Result` em vez de lançar.

### Montar um evento para publicar

```ts
import { EVENT_EXCHANGE, type EventEnvelope } from "@zipframes/schemas";
import type { UserRegisteredPayload } from "@zipframes/schemas/auth-service";

const event: EventEnvelope<UserRegisteredPayload> = {
  eventId: randomUUID(),
  eventType: "user.registered",
  version: 1,
  occurredAt: new Date().toISOString(),
  correlationId,
  payload: { userId, email, name },
};
// publicar em EVENT_EXCHANGE ("zipframes.events") com routing key = eventType
```

### Gerar JSON Schema para OpenAPI

```ts
import { jsonSchemaOf } from "@zipframes/schemas";
import { loginRequestSchema } from "@zipframes/schemas/auth-service";

const body = jsonSchemaOf(loginRequestSchema); // sem o campo $schema
```

## Envelope

Todo evento tem a mesma forma. `eventEnvelopeSchema(payloadSchema)` monta o schema completo para um payload.

| Campo           | Tipo             | Descrição                                 |
| --------------- | ---------------- | ----------------------------------------- |
| `eventId`       | UUID             | Identidade desta publicação               |
| `eventType`     | string           | Nome do evento, igual à routing key       |
| `version`       | inteiro positivo | Versão do payload                         |
| `occurredAt`    | data ISO 8601    | Quando o fato aconteceu                   |
| `correlationId` | UUID             | Liga o evento à requisição que o originou |
| `payload`       | objeto           | Dados do evento                           |

## Contratos

| Subcaminho                            | Eventos                                                       | HTTP                                          |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `@zipframes/schemas/auth-service`     | `user.registered`, `user.updated`, `user.deleted`             | cadastro, login e JWKS                        |
| `@zipframes/schemas/video-service`    | `video.uploaded`                                              | upload, listagem, detalhe e download de vídeo |
| `@zipframes/schemas/processor-worker` | `video.processing.started`, `video.processed`, `video.failed` |                                               |
| `@zipframes/schemas/shared`           | envelope, `EVENT_EXCHANGE`, `parseSchema`                     |                                               |

Cada evento tem um schema de payload (`userRegisteredPayloadSchema`), um schema de envelope completo (`userRegisteredEventSchema`) e os tipos correspondentes (`UserRegisteredPayload`, `UserRegisteredEvent`).

### HTTP do video-service

| Rota                             | Entrada                                     | Resposta                    |
| -------------------------------- | ------------------------------------------- | --------------------------- |
| `POST /videos`                   | `multipart/form-data`, campo `file`         | `uploadVideoResponseSchema` |
| `GET /videos`                    | `listVideosQuerySchema` (`limit`, `before`) | `listVideosResponseSchema`  |
| `GET /videos/{videoId}`          | `videoIdParamsSchema`                       | `getVideoResponseSchema`    |
| `GET /videos/{videoId}/download` | `videoIdParamsSchema`                       | `downloadResponseSchema`    |
| `DELETE /videos/{videoId}`       | `videoIdParamsSchema`                       | 204, sem corpo              |

`listVideosQuerySchema` converte `limit` da query string (padrão 20, máximo 100). A próxima página usa `before` com o `createdAt` do último item recebido.

## Versionamento

Mudar a forma de um payload de um jeito incompatível exige uma nova `version` do evento e uma versão major do pacote. Um campo novo e opcional mantém a versão do evento.
