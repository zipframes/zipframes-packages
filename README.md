# ZipFrames Packages

Pacotes npm compartilhados pelos serviços do [ZipFrames](https://github.com/knzt/zipframes).

Eles ficam fora do repositório da aplicação para serem publicados e versionados. Cada serviço declara a versão que usa e só recebe uma mudança quando sobe essa versão.

## Pacotes

| Pacote                                               | Para quê                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| [`@zipframes/core`](packages/core)                   | `Result`, branded types, erros com status HTTP, readiness           |
| [`@zipframes/value-objects`](packages/value-objects) | E-mail, telefone, CPF, CNPJ, nome e a base para criar value objects |
| [`@zipframes/schemas`](packages/schemas)             | Schemas Zod dos eventos e das APIs HTTP                             |
| [`@zipframes/http`](packages/http)                   | Handlers HTTP independentes de framework, com validação e JWT       |
| [`@zipframes/authenticator`](packages/authenticator) | Verificação de JWT contra um JWKS                                   |
| [`@zipframes/communication`](packages/communication) | Publicação e consumo de eventos com retry, backoff e DLQ            |
| [`@zipframes/logger`](packages/logger)               | Logs JSON com correlation ID                                        |
| [`@zipframes/telemetry`](packages/telemetry)         | Métricas Prometheus e tracing OpenTelemetry                         |
| [`@zipframes/test-toolkit`](packages/test-toolkit)   | Containers de teste para Postgres, RabbitMQ, Redis e S3             |

## Instalação

Os pacotes são publicados no GitHub Packages. No `.npmrc` do projeto:

```
@zipframes:registry=https://npm.pkg.github.com
```

O GitHub Packages exige um token com `read:packages` mesmo para pacotes públicos. No `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=<seu token>
```

Depois, `pnpm add @zipframes/<pacote>`. Todos são ESM.

## O que entra aqui

Um CPF válido é o mesmo em qualquer sistema, então a validação de CPF é biblioteca. Já a política de senha, as extensões de vídeo aceitas e os status de um vídeo são regras de um contexto e ficam no serviço que as define.

Entra aqui:

- o que é definido por uma norma ou por um órgão externo (CPF, RFC 9457);
- o que é técnico e não carrega regra de negócio (retry, logs, métricas);
- contratos que mais de um serviço precisa ler da mesma forma (os schemas dos eventos).

## Documentação

| Documento                                           | Conteúdo                                             |
| --------------------------------------------------- | ---------------------------------------------------- |
| [Estrutura](docs/estrutura.md)                      | Organização do repositório e de cada pacote          |
| [Value objects](docs/value-objects.md)              | O contrato do value object base e como criar os seus |
| [Versionamento e publicação](docs/versionamento.md) | Semver, changesets e o fluxo de release              |

## Desenvolvimento

```bash
pnpm install
pnpm build
pnpm test:coverage
pnpm lint
pnpm format          # pnpm format:write corrige
```

O changeset de cada PR é gerado a partir dos commits `feat` e `fix` (Conventional Commits) e commitado de volta na branch. `chore`, `refactor`, `test` e `docs` não geram versão. Rode `pnpm changeset` à mão só quando a mudança pedir um resumo mais completo do que a mensagem do commit. O fluxo inteiro está em [docs/versionamento.md](docs/versionamento.md).
