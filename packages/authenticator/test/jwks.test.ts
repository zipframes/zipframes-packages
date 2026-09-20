import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { exportJWK, generateKeyPair } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createJwksClient } from "../src/jwks/index.js";

const startJwksServer = async (jwks: { keys: unknown[] }) => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(jwks));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${String(port)}/jwks`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
};

describe("createJwksClient", () => {
  let close: () => Promise<void>;
  let url: string;
  let kid: string;

  beforeAll(async () => {
    const { publicKey } = await generateKeyPair("RS256", { extractable: true });
    const jwk = await exportJWK(publicKey);
    kid = "test-key";
    jwk.kid = kid;
    jwk.alg = "RS256";
    jwk.use = "sig";

    const server = await startJwksServer({ keys: [jwk] });
    url = server.url;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("exposes the JWKS url and a getKey resolver", async () => {
    const client = createJwksClient({
      url,
      cooldownDurationMs: 0,
      timeoutDurationMs: 5_000,
    });

    expect(client.url.href).toBe(url);

    const key = await client.getKey({ alg: "RS256", kid }, { payload: "", signature: "" });
    expect(key).toBeDefined();
  });

  it("works with default cooldown and timeout options", async () => {
    const client = createJwksClient({ url });
    const key = await client.getKey({ alg: "RS256", kid }, { payload: "", signature: "" });
    expect(key).toBeDefined();
  });
});
