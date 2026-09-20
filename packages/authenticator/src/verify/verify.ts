import { jwtVerify } from "jose";
import type { JWTPayload, JWTVerifyGetKey } from "jose";

import { UnauthorizedError } from "@zipframes/core/errors";
import { err, ok } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";

import { createJwksClient } from "../jwks/index.js";
import type { JwksClientOptions } from "../jwks/index.js";

export type AuthenticatorOptions = {
  readonly jwks: JwksClientOptions;
  readonly issuer: string;
  readonly audience: string | readonly string[];
  /** Allowed signing algorithms. Defaults to RS256. */
  readonly algorithms?: readonly string[];
  /** Clock skew tolerance in seconds. */
  readonly clockToleranceSeconds?: number;
};

/**
 * Claims extracted from a verified access token. `sub` is the user id that
 * services put in the request context. Extra claims from auth-service are
 * preserved as-is.
 */
export type VerifiedClaims = JWTPayload & {
  readonly sub: string;
};

export type Authenticator = {
  /**
   * Verifies signature, issuer, audience and expiry. Returns the claims on
   * success, or an `UnauthorizedError` when the token is missing, malformed,
   * expired or signed with an unknown key.
   */
  readonly verify: (token: string) => Promise<Result<VerifiedClaims, UnauthorizedError>>;
};

const toUnauthorized = (cause: unknown): UnauthorizedError => {
  const message =
    cause instanceof Error && cause.message.length > 0 ? cause.message : "invalid or expired token";

  return new UnauthorizedError("AUTH_INVALID_TOKEN", message, { cause });
};

const hasSubject = (payload: JWTPayload): payload is VerifiedClaims =>
  typeof payload.sub === "string" && payload.sub.length > 0;

/**
 * Builds an authenticator that verifies JWTs against the JWKS published by
 * auth-service. It answers who the caller is; authorization stays in each
 * service.
 */
export const createAuthenticator = (options: AuthenticatorOptions): Authenticator => {
  const { getKey } = createJwksClient(options.jwks);
  return createAuthenticatorFromKey(getKey, options);
};

/**
 * Same as `createAuthenticator`, but takes a ready-made key resolver. Useful
 * in tests with a local JWKS, without standing up an HTTP server.
 */
export const createAuthenticatorFromKey = (
  getKey: JWTVerifyGetKey,
  options: Omit<AuthenticatorOptions, "jwks">,
): Authenticator => {
  const algorithms = [...(options.algorithms ?? ["RS256"])];
  const audience: string | string[] =
    typeof options.audience === "string" ? options.audience : [...options.audience];

  return {
    verify: async (token) => {
      if (token.trim().length === 0) {
        return err(new UnauthorizedError("AUTH_MISSING_TOKEN", "token must not be empty"));
      }

      try {
        const { payload } = await jwtVerify(token, getKey, {
          issuer: options.issuer,
          audience,
          algorithms,
          ...(options.clockToleranceSeconds !== undefined
            ? { clockTolerance: options.clockToleranceSeconds }
            : {}),
        });

        if (!hasSubject(payload)) {
          return err(
            new UnauthorizedError("AUTH_MISSING_SUBJECT", "token is missing a subject claim"),
          );
        }

        return ok(payload);
      } catch (cause) {
        return err(toUnauthorized(cause));
      }
    },
  };
};
