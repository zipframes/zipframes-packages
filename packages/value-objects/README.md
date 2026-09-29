# @zipframes/value-objects

Value objects validados e imutáveis para dados brasileiros e de contato (e-mail, telefone, CPF, CNPJ e nome), e `defineValueObject`, a função que você usa para criar os seus com o mesmo comportamento.

Um value object aqui é o próprio valor primitivo com um branded type. `Email.create(" Ana@Exemplo.com ")` devolve a string `"ana@exemplo.com"`, mas o TypeScript não aceita uma string comum onde se espera um `Email`.

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
pnpm add @zipframes/value-objects @zipframes/core
```

O pacote é ESM.

## Uso

```ts
import { Email, Cpf } from "@zipframes/value-objects";

const email = Email.create(" Ana@Exemplo.com ");

if (email.ok) {
  sendWelcome(email.value); // "ana@exemplo.com", tipado como Email
} else {
  console.log(email.error); // { valueObject: "Email", code: "INVALID_FORMAT", message: "..." }
}

Cpf.is("123.456.789-09"); // true ou false, sem criar o valor
```

Cada value object tem:

| Membro            | Descrição                                                     |
| ----------------- | ------------------------------------------------------------- |
| `create(raw)`     | Valida e normaliza; devolve `Result<valor, ValueObjectError>` |
| `is(raw)`         | Diz se o valor bruto é válido                                 |
| `equals(a, b)`    | Compara por conteúdo                                          |
| `toJSON(value)`   | Forma serializada                                             |
| `toString(value)` | Forma legível, para log e mensagem                            |

## Value objects prontos

| Nome    | Normalização                           | Códigos de erro                                                                 |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `Email` | trim e minúsculas                      | `EMPTY`, `TOO_LONG`, `INVALID_FORMAT`                                           |
| `Phone` | só dígitos, DDD incluído, sem o `55`   | `INVALID_CHARACTERS`, `INVALID_LENGTH`, `INVALID_DDD`, `INVALID_LOCAL_NUMBER`   |
| `Cpf`   | só dígitos (11)                        | `INVALID_CHARACTERS`, `INVALID_LENGTH`, `ALL_SAME_DIGIT`, `INVALID_CHECK_DIGIT` |
| `Cnpj`  | só dígitos (14)                        | `INVALID_CHARACTERS`, `INVALID_LENGTH`, `ALL_SAME_DIGIT`, `INVALID_CHECK_DIGIT` |
| `Name`  | trim e espaços colapsados, sem dígitos | `EMPTY`, `TOO_SHORT`, `TOO_LONG`, `INVALID_FORMAT`                              |

`Phone` aceita fixo (10 dígitos) e celular (11 dígitos) com DDD atribuído pela Anatel, com ou sem `+55` e com a formatação usual (`(11) 91234-5678`). A validação de e-mail é propositalmente simples: recusa o que está claramente errado (sem `@`, sem domínio, com espaço). A única prova de que um endereço existe é mandar uma mensagem para ele.

## Criando o seu

```ts
import { defineValueObject } from "@zipframes/value-objects";
import { ok, err } from "@zipframes/core/result";
import type { Brand } from "@zipframes/core";

export const Sku = defineValueObject({
  name: "Sku",
  parse: (raw: string) => {
    const value = raw.trim().toUpperCase();
    return /^[A-Z]{3}-\d{4}$/.test(value)
      ? ok(value)
      : err({ code: "INVALID_FORMAT", message: "sku must look like ABC-1234" });
  },
});

export type Sku = Brand<string, "Sku">;
```

`parse` recebe o valor bruto e devolve `ok(valorNormalizado)` ou `err({ code, message })`; o `valueObject` do erro é preenchido com o `name`. `serialize` e `equals` são opcionais, para quando o valor não é um primitivo.

A função não depende de Zod nem de nenhuma biblioteca de validação, e não conhece mensagens para o usuário final nem códigos HTTP. Traduzir o erro é trabalho de quem apresenta a resposta.

O porquê de cada escolha da base está em [docs/value-objects.md](https://github.com/zipframes/zipframes-packages/blob/main/docs/value-objects.md).
