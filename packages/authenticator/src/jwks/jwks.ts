import { createRemoteJWKSet } from "jose";
import type { JWTVerifyGetKey } from "jose";

export type JwksClientOptions = {
  /** Absolute URL of the JWKS endpoint published by auth-service. */
  readonly url: string;
  /**
   * Minimum time between JWKS refetches after a successful response, in ms.
   * Defaults to jose's own cooldown (30s).
   */
  readonly cooldownDurationMs?: number;
  /** HTTP timeout for JWKS fetches, in ms. */
  readonly timeoutDurationMs?: number;
};

export type JwksClient = {
  readonly getKey: JWTVerifyGetKey;
  readonly url: URL;
};

/**
 * Builds a JWKS client that fetches and caches the public keys published by
 * auth-service. Callers verify tokens through this client; they never talk to
 * the JWKS endpoint themselves.
 */
export const createJwksClient = (options: JwksClientOptions): JwksClient => {
  const url = new URL(options.url);
  const getKey = createRemoteJWKSet(url, {
    ...(options.cooldownDurationMs !== undefined
      ? { cooldownDuration: options.cooldownDurationMs }
      : {}),
    ...(options.timeoutDurationMs !== undefined
      ? { timeoutDuration: options.timeoutDurationMs }
      : {}),
  });

  return { getKey, url };
};
