# @zipframes/value-objects

## 0.3.0

### Minor Changes

- [#57](https://github.com/zipframes/zipframes-packages/pull/57) [`2f1fb6e`](https://github.com/zipframes/zipframes-packages/commit/2f1fb6e56d4c0b09b6545150fc5b3cc63e7c5215) Thanks [@knzt](https://github.com/knzt)! - - feat(value-objects): o pacote passa a ser a fonte única dos value objects do sistema, com `Password`, `VideoFileName` e `VideoFile`, que antes eram definidos dentro dos serviços

  `Password` valida a política da plataforma (8 caracteres no mínimo, 72 bytes no máximo, com letra e com dígito) e **nunca serializa o valor**: `toJSON` e `toString` devolvem `[redacted]`.

  `VideoFileName` recusa separador de caminho e caractere de controle, e exige uma das extensões de `ACCEPTED_VIDEO_EXTENSIONS`. `asVideoFileName` reidrata um nome já validado, vindo do banco. O nome não é `FileName` de propósito: num pacote compartilhado, um `FileName` que recusa `.pdf` seria uma armadilha.

  `VideoFile` compõe os dois, validando o par nome e MIME type antes de receber qualquer byte.

  Nada foi removido, então quem já usa o pacote não precisa mudar nada.

## 0.2.4

### Patch Changes

- Updated dependencies [[`ec14344`](https://github.com/zipframes/zipframes-packages/commit/ec1434463e4d8f9d5bead547df76b6589ba72821)]:
  - @zipframes/core@0.5.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`5a06932`](https://github.com/zipframes/zipframes-packages/commit/5a06932307ba4124454ab4052a95bfb471122cdc)]:
  - @zipframes/core@0.4.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`47e71c0`](https://github.com/zipframes/zipframes-packages/commit/47e71c0a4bff6ecceb0029311c686364dacdbe48)]:
  - @zipframes/core@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`663e368`](https://github.com/zipframes/zipframes-packages/commit/663e3688358011e52f6cb4e0f39b6bebf05e0150)]:
  - @zipframes/core@0.2.0

## 0.2.0

### Minor Changes

- [#25](https://github.com/zipframes/zipframes-packages/pull/25) [`b56f89f`](https://github.com/zipframes/zipframes-packages/commit/b56f89f02f9b246165f02245fa390166c3228b1b) Thanks [@knzt](https://github.com/knzt)! - Add `Name` value object for person/display names (trim, collapse whitespace, length and letter-based format checks).

## 0.1.0

### Minor Changes

- [#11](https://github.com/zipframes/zipframes-packages/pull/11) [`a233234`](https://github.com/zipframes/zipframes-packages/commit/a2332346e2a32ed1b11e92bec39586f02b67ec67) Thanks [@knzt](https://github.com/knzt)! - Add the first implementation of `@zipframes/value-objects`:

  - `defineValueObject`, the value object base: validated creation returning
    `Result`, branded types, value equality and serialization, with sensible
    defaults that can be overridden per value object.
  - `Email`: format validation, trimming and lowercase normalization.
  - `Phone`: Brazilian mobile and landline numbers, validated against
    ANATEL's list of unassigned DDDs and the mandatory 9th digit for mobiles.
  - `Cpf` and `Cnpj`: real check-digit validation, rejecting all-same-digit
    placeholders that would otherwise pass the checksum.

  `Address`/postal code was dropped from scope: nothing in ZipFrames' own
  domain uses it, and it can be added later if a service needs it.
