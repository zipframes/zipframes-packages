import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import type { JWK } from "jose";

import { createAuthenticatorFromKey } from "@zipframes/authenticator";

export const ISSUER = "https://auth.zipframes.local";
export const AUDIENCE = "video-service";

export type AuthFixture = {
  readonly sign: (claims?: Record<string, unknown>) => Promise<string>;
  readonly authenticator: ReturnType<typeof createAuthenticatorFromKey>;
};

export const buildAuthFixture = async (): Promise<AuthFixture> => {
  const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
  const publicJwk = (await exportJWK(publicKey)) as JWK;
  publicJwk.kid = "auth-key-1";
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  return {
    sign: (claims = {}) =>
      new SignJWT({ ...claims })
        .setProtectedHeader({ alg: "RS256", kid: "auth-key-1" })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setSubject(typeof claims.sub === "string" ? claims.sub : "user-1")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(privateKey),
    authenticator: createAuthenticatorFromKey(createLocalJWKSet({ keys: [publicJwk] }), {
      issuer: ISSUER,
      audience: AUDIENCE,
    }),
  };
};
