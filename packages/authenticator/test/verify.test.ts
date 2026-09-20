import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import type { JWK } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { isOk, isErr } from "@zipframes/core/result";

import { createAuthenticator, createAuthenticatorFromKey } from "../src/verify/index.js";

const ISSUER = "https://auth.zipframes.local";
const AUDIENCE = "video-service";

type Fixture = {
  readonly privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
  readonly publicJwk: JWK;
  readonly sign: (
    claims?: Record<string, unknown>,
    header?: Record<string, string>,
  ) => Promise<string>;
};

const buildFixture = async (): Promise<Fixture> => {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "auth-key-1";
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  return {
    privateKey,
    publicJwk,
    sign: (claims = {}, header = {}) =>
      new SignJWT({ ...claims })
        .setProtectedHeader({ alg: "RS256", kid: "auth-key-1", ...header })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setSubject(typeof claims.sub === "string" ? claims.sub : "user-1")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(privateKey),
  };
};

const startJwksServer = async (jwks: { keys: JWK[] }) => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(jwks));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${String(port)}/.well-known/jwks.json`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
};

describe("createAuthenticatorFromKey", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await buildFixture();
  });

  it("returns the claims of a valid token", async () => {
    const authenticator = createAuthenticatorFromKey(
      createLocalJWKSet({ keys: [fixture.publicJwk] }),
      { issuer: ISSUER, audience: AUDIENCE, clockToleranceSeconds: 5 },
    );

    const token = await fixture.sign({ sub: "user-42", role: "member" });
    const result = await authenticator.verify(token);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.sub).toBe("user-42");
      expect(result.value.iss).toBe(ISSUER);
      expect(result.value.aud).toBe(AUDIENCE);
      expect(result.value.role).toBe("member");
    }
  });

  it("accepts a list of audiences", async () => {
    const authenticator = createAuthenticatorFromKey(
      createLocalJWKSet({ keys: [fixture.publicJwk] }),
      { issuer: ISSUER, audience: [AUDIENCE, "notification-service"] },
    );

    const result = await authenticator.verify(await fixture.sign());
    expect(isOk(result)).toBe(true);
  });

  it("rejects an empty token", async () => {
    const authenticator = createAuthenticatorFromKey(
      createLocalJWKSet({ keys: [fixture.publicJwk] }),
      { issuer: ISSUER, audience: AUDIENCE },
    );

    const result = await authenticator.verify("   ");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_MISSING_TOKEN");
    }
  });

  it("rejects a token with the wrong issuer", async () => {
    const authenticator = createAuthenticatorFromKey(
      createLocalJWKSet({ keys: [fixture.publicJwk] }),
      { issuer: ISSUER, audience: AUDIENCE },
    );

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: "auth-key-1" })
      .setIssuer("https://evil.example")
      .setAudience(AUDIENCE)
      .setSubject("user-1")
      .setExpirationTime("2h")
      .sign(fixture.privateKey);

    const result = await authenticator.verify(token);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_INVALID_TOKEN");
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  it("rejects a token without a subject", async () => {
    const authenticator = createAuthenticatorFromKey(
      createLocalJWKSet({ keys: [fixture.publicJwk] }),
      { issuer: ISSUER, audience: AUDIENCE },
    );

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: "auth-key-1" })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime("2h")
      .sign(fixture.privateKey);

    const result = await authenticator.verify(token);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_MISSING_SUBJECT");
    }
  });

  it("maps a non-Error rejection to a default message", async () => {
    const authenticator = createAuthenticatorFromKey(
      async () => {
        throw "boom";
      },
      { issuer: ISSUER, audience: AUDIENCE },
    );

    const result = await authenticator.verify(await fixture.sign());
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_INVALID_TOKEN");
      expect(result.error.message).toBe("invalid or expired token");
    }
  });
});

describe("createAuthenticator", () => {
  let fixture: Fixture;
  let jwksUrl: string;
  let close: () => Promise<void>;

  beforeAll(async () => {
    fixture = await buildFixture();
    const server = await startJwksServer({ keys: [fixture.publicJwk] });
    jwksUrl = server.url;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("verifies a token against a remote JWKS", async () => {
    const authenticator = createAuthenticator({
      jwks: { url: jwksUrl, cooldownDurationMs: 0, timeoutDurationMs: 5_000 },
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["RS256"],
      clockToleranceSeconds: 0,
    });

    const result = await authenticator.verify(await fixture.sign({ sub: "remote-user" }));
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.sub).toBe("remote-user");
    }
  });

  it("works with default jwks and algorithm options", async () => {
    const authenticator = createAuthenticator({
      jwks: { url: jwksUrl },
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const result = await authenticator.verify(await fixture.sign());
    expect(isOk(result)).toBe(true);
  });
});
