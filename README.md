# ZipFrames Packages

Pacotes npm compartilhados pelos serviços do [ZipFrames](https://github.com/knzt/zipframes).

Eles vivem fora do repositório da aplicação de propósito: publicados e versionados, cada serviço declara a versão que usa e adota uma mudança quando decide subir de versão, em vez de ser afetado no mesmo instante em que o pacote muda.

## Pacotes

| Pacote                                               | Conteúdo                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| [`@zipframes/schemas`](packages/schemas)             | Contratos de eventos e de API, organizados por serviço em `src/services` |
| [`@zipframes/value-objects`](packages/value-objects) | Value objects genéricos e o value object base                            |
| [`@zipframes/core`](packages/core)                   | `Result`, branded types e erros base                                     |
| [`@zipframes/communication`](packages/communication) | Publisher, consumer, retry e DLQ                                         |
| [`@zipframes/logger`](packages/logger)               | Logs estruturados com correlation ID                                     |
| [`@zipframes/telemetry`](packages/telemetry)         | Métricas Prometheus e tracing OpenTelemetry                              |
| [`@zipframes/authenticator`](packages/authenticator) | Validação de JWT via JWKS                                                |
| [`@zipframes/test-toolkit`](packages/test-toolkit)   | Base de testes de integração com Testcontainers                          |

## O que entra aqui

Um CPF válido é o mesmo em qualquer sistema do mundo, então a validação é biblioteca. Já a política de senha, as extensões de vídeo aceitas e o `VideoStatus` são regras de um contexto específico e ficam dentro do serviço que as define.

Entra aqui:

- o que é universal, definido por uma norma, uma RFC ou um órgão externo;
- o que é puramente técnico, sem regra de negócio de nenhum contexto;
- contratos que mais de um serviço precisa enxergar da mesma forma.

## Documentação

| Documento                                           | Conteúdo                                             |
| --------------------------------------------------- | ---------------------------------------------------- |
| [Estrutura](docs/estrutura.md)                      | Organização do repositório e de cada pacote          |
| [Value objects](docs/value-objects.md)              | O contrato do value object base e como criar os seus |
| [Versionamento e publicação](docs/versionamento.md) | Semver, changesets e o fluxo de release              |

## Estrutura

```
zipframes-packages/
├── packages/
│   ├── schemas/
│   ├── value-objects/
│   ├── core/
│   ├── communication/
│   ├── logger/
│   ├── telemetry/
│   ├── authenticator/
│   └── test-toolkit/
└── docs/
```

## Contribuindo

```bash
pnpm install          # instala as dependências do monorepo
pnpm build             # builda todos os pacotes
pnpm test:coverage     # roda os testes com cobertura
pnpm lint              # ESLint
pnpm format            # confere a formatação (pnpm format:write para corrigir)
```

O changeset de cada PR é gerado sozinho a partir dos commits `feat`/`fix` (Conventional Commits), e commitado de volta na própria branch — não precisa rodar `pnpm changeset` à mão, a menos que a mudança mereça um resumo mais rico do que a mensagem do commit carrega. `chore`, `refactor`, `test` e `docs` não abrem versão, nem no PR nem na `main`. Veja [docs/versionamento.md](docs/versionamento.md) para o fluxo completo de versão e publicação.

## Status

Os oito pacotes estão implementados e publicados no GitHub Packages. Cada serviço declara a faixa que consome.
