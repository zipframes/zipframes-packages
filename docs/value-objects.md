# Value objects

`@zipframes/value-objects` é a **fonte única dos value objects do sistema**. Todo valor validado e imutável do ZipFrames mora aqui: nenhum serviço define os seus. O pacote traz também a **base**, `defineValueObject`, com que todos eles são construídos.

## Por que uma fonte única

Um value object é uma regra sobre o que é um valor válido. Quando a mesma regra existe em dois lugares, ela deixa de ser uma regra: o auth-service e um cliente futuro podem discordar sobre o que é uma senha aceitável, e nada no código aponta a divergência. Concentrar aqui dá uma resposta só, versionada, e o TypeScript recusa a string crua nas fronteiras.

O custo é real e vale dizer em voz alta: **mudar a política de senha ou a lista de extensões aceitas passa a exigir publicar uma versão do pacote e atualizar o serviço.** É mais lento do que editar um arquivo no serviço. A troca é deliberada — a regra ganha um dono e um histórico, em vez de derivar em cópias.

## O que não é value object

Nem tudo que vive numa pasta `valueObjects/` pertence aqui. Continuam no serviço:

| O que                                                              | Por quê                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Máquinas de estado, como a união `VideoStatus` e os conjuntos dela | São o vocabulário de transição de um agregado, não valor validado |
| Formatos de payload, como `ProcessingJob`                          | São o contrato de uma mensagem; o dono é o `schemas`              |
| Tipos marcados sem validação, como `PasswordHash`                  | São detalhe do adaptador que os produz, não regra de domínio      |

A régua: se não passa por um `parse` que aceita ou rejeita, não é value object.

## Por que uma base

Sem ela, cada value object inventaria seu jeito de validar, comparar e serializar, e a única coisa que os manteria parecidos seria disciplina. Com a base, o padrão vem junto: um `VideoFileName` tem exatamente a forma de um `Cpf`.

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

Os genéricos, que valeriam em qualquer sistema:

| Grupo      | Value objects    | Regra                                                 |
| ---------- | ---------------- | ----------------------------------------------------- |
| `contact`  | `Email`, `Phone` | Formato de e-mail e telefone, com normalização        |
| `document` | `Cpf`, `Cnpj`    | Dígitos verificadores, definidos pela Receita Federal |
| `identity` | `Name`           | Nome de pessoa: trim, espaços colapsados, sem dígitos |

E os da plataforma, cuja regra o ZipFrames escolheu:

| Value object    | Regra                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| `Password`      | Mínimo de 8 caracteres, máximo de 72 **bytes**, com letra e com dígito |
| `VideoFileName` | Nome sem separador de caminho, com uma extensão de vídeo aceita        |
| `VideoFile`     | O par nome e MIME type, validado antes de receber qualquer byte        |

Duas observações sobre esses três:

- **`Password` nunca serializa o valor.** `toJSON` e `toString` devolvem `[redacted]`. Senha chega a log e a payload de erro exatamente por essas duas funções, e o texto puro não deve sair da memória. Só o hash é persistido, e isso é assunto do serviço.
- **`VideoFileName` não se chama `FileName`.** Um `FileName` num pacote compartilhado que recusa `.pdf` seria uma armadilha; o nome diz de qual arquivo se trata.

Todos são construídos com a mesma base, então servem de exemplo vivo do padrão.
