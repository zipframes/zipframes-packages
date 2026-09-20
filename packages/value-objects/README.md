# @zipframes/value-objects

Value objects genéricos e a base para criar os seus dentro de cada serviço.

## O que é

- value objects universais: e-mail, telefone, CPF, CNPJ e nome
- a base que padroniza criação validada, imutabilidade, igualdade por valor, serialização e branded type

O contrato da base está em [docs/value-objects.md](../../docs/value-objects.md).

## Status

`base`, `Email`, `Phone`, `Cpf`, `Cnpj` e `Name` implementados, com cobertura de testes de 100%.

Depende de `@zipframes/core` (`Result` e `Brand`), declarado com `workspace:^`.
