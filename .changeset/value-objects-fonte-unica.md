---
"@zipframes/value-objects": minor
---

- feat(value-objects): o pacote passa a ser a fonte única dos value objects do sistema, com `Password`, `VideoFileName` e `VideoFile`, que antes eram definidos dentro dos serviços

`Password` valida a política da plataforma (8 caracteres no mínimo, 72 bytes no máximo, com letra e com dígito) e **nunca serializa o valor**: `toJSON` e `toString` devolvem `[redacted]`.

`VideoFileName` recusa separador de caminho e caractere de controle, e exige uma das extensões de `ACCEPTED_VIDEO_EXTENSIONS`. `asVideoFileName` reidrata um nome já validado, vindo do banco. O nome não é `FileName` de propósito: num pacote compartilhado, um `FileName` que recusa `.pdf` seria uma armadilha.

`VideoFile` compõe os dois, validando o par nome e MIME type antes de receber qualquer byte.

Nada foi removido, então quem já usa o pacote não precisa mudar nada.
