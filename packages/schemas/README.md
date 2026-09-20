# @zipframes/schemas

Contratos de eventos e de API do ZipFrames, organizados por serviço publicador.

## O que é

- schemas dos eventos de integração, com envelope e versão
- schemas de request e response das APIs HTTP
- tipos derivados dos schemas, para uso em tempo de compilação

## Fonte

Derivado da linguagem ubíqua e do mapa de eventos em
[`knzt/zipframes` `docs/domain/dominio.md`](https://github.com/knzt/zipframes/blob/main/docs/domain/dominio.md).
Quando AsyncAPI/OpenAPI forem fechados no app, estes schemas acompanham.

## Imports

```ts
import { parseSchema } from "@zipframes/schemas";
import { userRegisteredEventSchema } from "@zipframes/schemas/auth-service";
import { videoUploadedEventSchema } from "@zipframes/schemas/video-service";
import { videoFailedEventSchema } from "@zipframes/schemas/processor-worker";
```

Quem consome importa do **serviço publicador**.

## Eventos (v1)

| Evento                                                          | Publicador       | Payload                                                            |
| --------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| `user.registered` / `user.updated` / `user.deleted`             | auth-service     | ver `auth-service`                                                 |
| `video.uploaded`                                                | video-service    | `videoId`, `ownerId`, `sourceKey`, `originalFileName`, `sizeBytes` |
| `video.processing.started` / `video.processed` / `video.failed` | processor-worker | ver `processor-worker`                                             |

Exchange: `zipframes.events`.
