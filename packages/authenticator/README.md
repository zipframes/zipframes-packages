# @zipframes/authenticator

Verifica JWTs contra um endpoint JWKS: assinatura, emissor, audiência e expiração. Devolve as claims em um `Result`, sem lançar exceção.

Ele responde quem está chamando. Decidir o que essa pessoa pode fazer continua sendo papel de quem usa o pacote.

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
pnpm add @zipframes/authenticator @zipframes/core
```

O pacote é ESM.

## Uso

```ts
import { createAuthenticator } from "@zipframes/authenticator";

const authenticator = createAuthenticator({
  jwks: { url: "https://auth.example.com/.well-known/jwks.json" },
  issuer: "https://auth.example.com",
  audience: "my-api",
});

const result = await authenticator.verify(token);

if (result.ok) {
  const userId = result.value.sub;
} else {
  // result.error é um UnauthorizedError (statusCode 401)
  console.log(result.error.code);
}
```

As chaves são buscadas no primeiro uso e ficam em cache. Uma chave desconhecida (depois de uma rotação, por exemplo) faz o cliente buscar o JWKS de novo.

`verify` falha com `UnauthorizedError` quando o token está vazio (`AUTH_MISSING_TOKEN`), quando não tem `sub` (`AUTH_MISSING_SUBJECT`) ou quando a verificação falha (`AUTH_INVALID_TOKEN`).

### Com a chave já em mãos

`createAuthenticatorFromJwk` recebe a chave pública direto, sem buscar o JWKS por HTTP. É o que o auth-service usa nas próprias rotas: ele já tem em memória a chave com que assina, e chamar o próprio JWKS seria uma ida e volta HTTP a si mesmo, por uma porta que ele pode ainda não conhecer quando `PORT=0` deixa o sistema escolher. Em teste, vale pelo mesmo motivo: quem assina o token não precisa subir servidor para verificá-lo.

```ts
import { exportJWK, generateKeyPair } from "jose";
import { createAuthenticatorFromJwk } from "@zipframes/authenticator";

const { publicKey } = await generateKeyPair("RS256");
const publicJwk = { ...(await exportJWK(publicKey)), kid: "key-1", alg: "RS256" };

const authenticator = createAuthenticatorFromJwk(publicJwk, {
  issuer: "https://auth.test",
  audience: "my-api",
});
```

Aceita também uma lista, para uma rotação publicar duas chaves ao mesmo tempo. Para um resolvedor de chave montado à mão, use `createAuthenticatorFromKey`.

## Opções

| Opção                     | Padrão  | Descrição                                          |
| ------------------------- | ------- | -------------------------------------------------- |
| `jwks.url`                |         | URL absoluta do JWKS                               |
| `jwks.cooldownDurationMs` | 30000   | Intervalo mínimo entre duas buscas do JWKS         |
| `jwks.timeoutDurationMs`  |         | Timeout da requisição ao JWKS                      |
| `issuer`                  |         | Valor exigido na claim `iss`                       |
| `audience`                |         | Valor (ou lista) aceito na claim `aud`             |
| `algorithms`              | `RS256` | Algoritmos de assinatura aceitos                   |
| `clockToleranceSeconds`   |         | Tolerância de relógio na checagem de `exp` e `nbf` |

## API

| Export                       | Descrição                                                   |
| ---------------------------- | ----------------------------------------------------------- |
| `createAuthenticator`        | Cria o verificador a partir da URL do JWKS                  |
| `createAuthenticatorFromJwk` | Cria o verificador a partir da JWK pública, ou de uma lista |
| `createAuthenticatorFromKey` | Cria o verificador a partir de um resolvedor de chave       |
| `createJwksClient`           | Só o cliente de JWKS com cache, para uso direto no jose     |
| `VerifiedClaims`             | Claims do token, com `sub` obrigatório                      |
