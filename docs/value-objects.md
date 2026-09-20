# Value objects

O pacote `@zipframes/value-objects` traz dois tipos de coisa: os value objects genéricos, prontos para usar, e a **base** que padroniza a criação dos seus próprios, dentro de cada serviço.

## Por que uma base

Sem ela, cada serviço inventaria seu jeito de fazer value object e a única coisa que os manteria parecidos seria disciplina. Com a base publicada, o padrão vem junto com a biblioteca: quem vai criar um `VideoStatus` no video-service segue a mesma forma do `Cpf`.

## O que a base garante

| Característica          | O que significa                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Criação validada        | A construção passa por uma função de parse que aceita ou rejeita o valor. Não existe value object inválido             |
| Erro como valor         | A criação devolve `Result`, e não lança exceção. Erro de formato é esperado, não excepcional                           |
| Imutabilidade           | O valor é congelado depois de criado. Qualquer mudança gera um novo objeto                                             |
| Igualdade por valor     | Dois value objects com o mesmo conteúdo são iguais, independentemente da referência. É o que os distingue de entidades |
| Serialização previsível | `toString` e `toJSON` definidos, para que adapters não precisem conhecer o formato interno                             |
| Branded type            | O TypeScript recusa uma `string` crua onde se espera um `Email`                                                        |

## O que a base não faz

- **Não conhece mensagens de erro em português nem códigos HTTP.** A tradução do erro para o usuário é trabalho da camada de apresentação.
- **Não depende de Zod nem de nenhuma biblioteca de validação.** A validação é uma função pura recebida na definição.
- **Não decide política.** Ela garante que um e-mail tem formato válido, nunca se aquele e-mail pode se cadastrar.

Se a base começar a depender do stack, ela deixa de ser domínio e vira utilitário de framework, que é justamente o que não pode entrar na camada mais interna dos serviços.

## Forma de uso

A base é exposta como uma função de definição, e não como classe abstrata para herdar. A fábrica evita as armadilhas de herança em TypeScript, como construtor protegido que não impede a criação a partir de uma subclasse mal escrita, e deixa o tipo resultante explícito.

A definição recebe:

- o **nome** do value object, usado nas mensagens e na depuração;
- a função de **parse**, que recebe o valor bruto e devolve `Result` com o valor normalizado ou com o erro;
- opcionalmente, como **serializar** e como **comparar**, quando o padrão não serve.

E devolve o construtor, o tipo e os utilitários de igualdade e serialização.

## Value objects do pacote

| Grupo      | Value objects    | Regra                                                 |
| ---------- | ---------------- | ----------------------------------------------------- |
| `contact`  | `Email`, `Phone` | Formato de e-mail e telefone, com normalização        |
| `document` | `Cpf`, `Cnpj`    | Dígitos verificadores, definidos pela Receita Federal |
| `identity` | `Name`           | Nome de pessoa: trim, espaços colapsados, sem dígitos |

Todos são construídos com a mesma base, então servem de exemplo vivo do padrão.
