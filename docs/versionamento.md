# Versionamento e publicação

## Semver, com atenção aos contratos

Cada pacote tem sua própria versão e segue [semver](https://semver.org/lang/pt-BR/):

| Mudança                                                        | Versão |
| -------------------------------------------------------------- | ------ |
| Correção sem mudar a API                                       | patch  |
| Novidade compatível, como um campo opcional ou uma função nova | minor  |
| Qualquer coisa que quebre quem já usa                          | major  |

Para o `schemas` a régua é mais rígida, porque ele é o published language entre serviços: **tornar um campo obrigatório, remover um campo ou mudar o tipo de um campo existente é major**, mesmo que o TypeScript não reclame. Quem valida a mensagem em tempo de execução vai reclamar.

Quando um contrato de evento muda de forma incompatível, a prática é publicar a nova versão do evento **ao lado** da anterior e manter as duas até todos os consumidores migrarem, em vez de trocar o schema no lugar.

## Fluxo de release

O controle é feito com [Changesets](https://github.com/changesets/changesets). Três workflows cuidam de cada parte:

1. **`.github/workflows/prerelease.yml`**, a cada push num PR contra `main`: gera o changeset a partir dos commits `feat` e `fix` do PR (`.github/scripts/generate-changeset.mjs`) e o commita direto na branch do PR, num arquivo único (`auto-pr-<número>.md`) recalculado do zero a cada push relevante. Um changeset escrito à mão (`pnpm changeset`) sempre tem prioridade: o gerador automático não roda quando um já existe.
2. Esse changeset **entra no PR como qualquer outro arquivo** e vai para a `main` no merge — não é gerado depois, é revisável junto com o código que descreve.
3. **`.github/workflows/release.yml`**, a cada push na `main`: se o merge não trouxe changeset, gera um para cada pacote que o push alterou — inclusive quando o commit é `chore`, `refactor` ou `test`. `feat` continua minor, `fix` continua patch, e um marcador de breaking continua major; qualquer outro commit que toque o pacote entra como patch. O commit `chore: version packages` é ignorado, para o merge do PR de versão não abrir outro. Num PR com `feat`/`fix` o changeset já veio da branch e esse passo não dispara.
4. O mesmo workflow então abre (ou atualiza) um pull request **"Version Packages"**, com as versões calculadas e o changelog já escrito a partir dos changesets pendentes.
5. Revisar e mergear esse PR é o ato de decidir publicar. Ao mergear, o workflow roda de novo, não encontra mais changesets pendentes e publica as versões daquele PR no GitHub Packages.

Esse PR intermediário existe de propósito: mesmo sozinha, ter um passo explícito entre "acumulei mudanças" e "isso vai para o registry" evita publicar algo pela metade.

O changelog sai do resumo do changeset, que por sua vez sai das mensagens dos commits `feat`/`fix` quando é gerado automaticamente. Um commit com uma mensagem descritiva vira um changelog útil; `fix: ajuste` não ajuda ninguém a decidir se deve atualizar. Quando a mudança merece mais contexto do que uma linha de commit carrega, `pnpm changeset` continua disponível e substitui o automático.

### Como o gerador decide

`generate-changeset.mjs` lê os commits de um intervalo do git. Num pull request ele mantém só os que seguem Conventional Commits com tipo `feat` ou `fix`: `chore`, `refactor`, `test` ou `docs` não geram changeset nem snapshot. Na `main` o mesmo script roda com `--any-package-change`, e qualquer commit que altere arquivos dentro de um pacote gera changeset.

Para cada commit qualificado, descobre quais pacotes ele tocou pelos arquivos alterados dentro de `packages/*/`, e usa o `name` do `package.json` de cada um — não o nome da pasta — para preencher a entrada do changeset.

O bump de cada pacote é o maior entre os commits que o tocam: `feat` vira `minor`, `fix` vira `patch`, e um `!` depois do tipo (ou um rodapé `BREAKING CHANGE:`) vira `major`, na convenção usual de Conventional Commits. Na `main`, um commit que não é `feat` nem `fix` e mesmo assim altera o pacote entra como `patch`.

### Sem bump automático entre pacotes

Quando `@zipframes/core` sobe de versão, `@zipframes/value-objects` (que vai depender dele) **não** ganha uma versão nova sozinho. Ele só é republicado quando tiver seu próprio changeset, descrevendo o que mudou nele.

A única exceção é mecânica, não de conteúdo: se a versão nova do `core` ficar fora da faixa (`^`) que o `value-objects` declara no `package.json`, o Changesets sobe o `value-objects` em patch só para corrigir essa faixa, sem gerar mudança de comportamento nem entrada de changelog além de "dependência atualizada". É o `updateInternalDependents: "out-of-range"` do `.changeset/config.json`, o modo mais conservador que a ferramenta oferece: nenhum pacote é tocado por conveniência, só quando a faixa declarada deixaria de fazer sentido.

## Testar antes do merge: snapshots

Todo push num PR contra `main` passa pelo mesmo workflow que gera o changeset (`.github/workflows/prerelease.yml`), e publica uma versão de teste quando há algo para publicar:

1. **Decide se vale a pena.** Compara os commits deste push (todos, na primeira vez; só os novos, nas seguintes) contra o gerador de changeset. Esse portão vale só para o push no PR aberto. Um push que só traz `chore`, `docs`, `test` ou uma correção de lint não aciona snapshot nenhum — o snapshot anterior, se houver, continua valendo para teste. O merge na `main` não usa esse portão: o pacote alterado ganha versão mesmo assim. Um changeset escrito à mão no meio do PR também aciona o snapshot, mesmo sem commit `feat`/`fix` novo.
2. **Regenera o changeset do PR inteiro**, não só do push atual, no arquivo único `auto-pr-<número>.md`. Isso evita perder um pacote que um commit anterior já tinha tocado.
3. **Commita esse arquivo na própria branch do PR.** É o mesmo commit que vai para a `main` no merge — não existe uma segunda geração depois.
4. Publica com `changeset version --snapshot pr<número>` e `changeset publish --tag pr<número>`. A versão fica `0.1.0-pr7-20260101120000`: o próximo número real, a tag do PR e um timestamp, sem disputar a tag `latest` com a versão de verdade.
5. Comenta no PR o comando de instalação, atualizando o mesmo comentário a cada novo push relevante, em vez de acumular um por commit.

Para testar:

```bash
pnpm add @zipframes/core@pr7
```

O merge do PR não promove esse snapshot a versão real. Quem decide a versão definitiva é o changeset que o próprio PR já trouxe, pelo fluxo normal descrito acima.

## Onde os pacotes são publicados

No **GitHub Packages**, no escopo `@zipframes`. Consumir exige apontar o escopo para o registry do GitHub em um `.npmrc`:

```
@zipframes:registry=https://npm.pkg.github.com
```

Em repositório público, tanto a publicação quanto o consumo são gratuitos.

## Como os serviços consomem

Por faixa de versão, nunca por `workspace:*` ou por link local:

```json
{
  "dependencies": {
    "@zipframes/core": "^1.2.0",
    "@zipframes/schemas": "^2.0.0"
  }
}
```

É isso que dá autonomia ao serviço: uma mudança no pacote só chega quando o serviço decide subir de versão, com CI verde para provar que nada quebrou.

## Durante o desenvolvimento

Enquanto um pacote e um serviço evoluem juntos, `pnpm link` ou `npm link` resolvem sem publicar uma versão a cada tentativa. O link é temporário e nunca é commitado: o `package.json` do serviço continua declarando a faixa de versão.
