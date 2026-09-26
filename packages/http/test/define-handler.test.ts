import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import type { JWK } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createAuthenticatorFromKey } from "@zipframes/authenticator";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@zipframes/core/errors";
import { PROBLEM_CONTENT_TYPE, problemResponse, type ProblemDetails } from "@zipframes/core/http";
import { err, isErr, ok } from "@zipframes/core/result";

import { defineHandler } from "../src/define-handler.js";

const inputSchema = z.object({ name: z.string().min(1) });
const outputSchema = z.object({ id: z.string(), name: z.string() });

const correlationId = "corr-test-1";

const ISSUER = "https://auth.zipframes.local";
const AUDIENCE = "video-service";

type AuthFixture = {
  readonly sign: (claims?: Record<string, unknown>) => Promise<string>;
  readonly authenticator: ReturnType<typeof createAuthenticatorFromKey>;
};

const buildAuthFixture = async (): Promise<AuthFixture> => {
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

describe("defineHandler", () => {
  let authFixture: AuthFixture;

  beforeAll(async () => {
    authFixture = await buildAuthFixture();
  });

  it("returns success with validated input and output", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 201,
      handler: async (input) => ({ id: "user-1", name: input.name }),
    });

    const reply = await handler({
      body: { name: "Hellen" },
      correlationId,
    });

    expect(reply).toEqual({
      status: 201,
      body: { id: "user-1", name: "Hellen" },
    });
    expect(reply.contentType).toBeUndefined();
  });

  it("accepts a successful Result from the handler", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async (input) => ok({ id: "user-2", name: input.name }),
    });

    const reply = await handler({ body: { name: "Ana" }, correlationId });

    expect(reply).toEqual({
      status: 200,
      body: { id: "user-2", name: "Ana" },
    });
  });

  it("accepts a raw handler value without wrapping it in Result", async () => {
    const handler = defineHandler({
      inputSchema: z.object({}),
      outputSchema: z.object({ ok: z.literal(true) }),
      successStatus: 200,
      handler: async () => ({ ok: true as const }),
    });

    const reply = await handler({ body: {}, correlationId });
    expect(reply.status).toBe(200);
    expect(reply.body).toEqual({ ok: true });
  });

  it("maps input validation failures to problem+json", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async (input) => ({ id: "1", name: input.name }),
    });

    const reply = await handler({ body: { name: "" }, correlationId });

    expect(reply.status).toBe(400);
    expect(reply.contentType).toBe(PROBLEM_CONTENT_TYPE);
    expect(reply.body).toEqual({
      type: "about:blank",
      status: 400,
      title: "value does not match the schema",
      correlationId,
    });
  });

  it("maps use-case Result errors through the default error helper", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async () => err(new NotFoundError("USER_NOT_FOUND", "user not found")),
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(404);
    expect((reply.body as ProblemDetails).title).toBe("user not found");
    expect((reply.body as ProblemDetails).detail).toBeUndefined();
  });

  it("maps thrown BaseError instances through the default error helper", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async () => {
        throw new ConflictError("EMAIL_TAKEN", "email already registered");
      },
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(409);
    expect((reply.body as ProblemDetails).title).toBe("email already registered");
  });

  it("returns a generic 500 for unknown throws without leaking the driver message", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async () => {
        throw new Error("secret driver message");
      },
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(500);
    expect(reply.contentType).toBe(PROBLEM_CONTENT_TYPE);
    expect((reply.body as ProblemDetails).title).toBe("Internal server error");
    expect(JSON.stringify(reply.body)).not.toContain("secret driver message");
  });

  it("returns 500 when the handler output fails output schema validation", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async (input) =>
        ({ id: 123, name: input.name }) as unknown as z.infer<typeof outputSchema>,
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(500);
    expect((reply.body as ProblemDetails).title).toBe("Internal server error");
  });

  it("uses a custom error helper when provided", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      errorHelper: (_error, ctx) =>
        problemResponse(401, "Invalid credentials", undefined, ctx.correlationId),
      handler: async () => err(new ValidationError("SCHEMA_VALIDATION_FAILED", "ignored")),
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(401);
    expect((reply.body as ProblemDetails).title).toBe("Invalid credentials");
  });

  describe("without authenticator", () => {
    it("does not expose claims on the handler context", async () => {
      const handler = defineHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({ hasClaims: z.boolean() }),
        successStatus: 200,
        handler: async (_input, ctx) => ({
          hasClaims: "claims" in ctx,
        }),
      });

      const reply = await handler({
        body: {},
        correlationId,
        authorization: `Bearer ${await authFixture.sign()}`,
      });

      expect(reply.body).toEqual({ hasClaims: false });
    });
  });

  describe("with authenticator", () => {
    it("passes verified claims to the handler", async () => {
      const handler = defineHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({ ownerId: z.string() }),
        successStatus: 200,
        authenticator: authFixture.authenticator,
        handler: async (_input, ctx) => ({ ownerId: ctx.claims.sub }),
      });

      const token = await authFixture.sign({ sub: "user-42" });
      const reply = await handler({
        body: {},
        correlationId,
        authorization: `Bearer ${token}`,
      });

      expect(reply).toEqual({
        status: 200,
        body: { ownerId: "user-42" },
      });
    });

    it("rejects a missing bearer token before validating the body", async () => {
      let bodyValidated = false;
      const handler = defineHandler({
        inputSchema: z.object({ required: z.literal(true) }),
        outputSchema: z.object({ ok: z.literal(true) }),
        successStatus: 200,
        authenticator: authFixture.authenticator,
        handler: async () => {
          bodyValidated = true;
          return { ok: true as const };
        },
      });

      const reply = await handler({ body: {}, correlationId });

      expect(bodyValidated).toBe(false);
      expect(reply.status).toBe(401);
      expect((reply.body as ProblemDetails).title).toContain("authorization");
    });

    it("rejects an invalid token through the default error helper", async () => {
      const handler = defineHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({ ok: z.literal(true) }),
        successStatus: 200,
        authenticator: authFixture.authenticator,
        handler: async () => ({ ok: true as const }),
      });

      const reply = await handler({
        body: {},
        correlationId,
        authorization: "Bearer not-a-jwt",
      });

      expect(reply.status).toBe(401);
    });

    it("maps malformed authorization headers to AUTH_MISSING_TOKEN", async () => {
      const handler = defineHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({ ok: z.literal(true) }),
        successStatus: 200,
        authenticator: authFixture.authenticator,
        handler: async () => ({ ok: true as const }),
      });

      const reply = await handler({
        body: {},
        correlationId,
        authorization: "Basic abc",
      });

      expect(reply.status).toBe(401);
      expect((reply.body as ProblemDetails).title).toContain("Bearer");
    });
  });
});

describe("parseBearerToken via defineHandler", () => {
  it("uses AUTH_MISSING_TOKEN for an empty bearer value", async () => {
    const handler = defineHandler({
      inputSchema: z.object({}),
      outputSchema: z.object({ ok: z.literal(true) }),
      successStatus: 200,
      authenticator: (await buildAuthFixture()).authenticator,
      handler: async () => ({ ok: true as const }),
    });

    const reply = await handler({
      body: {},
      correlationId,
      authorization: "Bearer ",
    });

    expect(reply.status).toBe(401);
    expect((reply.body as ProblemDetails).title).toContain("Bearer");
  });
});

describe("authenticator verify errors", () => {
  it("returns UnauthorizedError codes from verify through errorHelper", async () => {
    const fixture = await buildAuthFixture();
    const verifyResult = await fixture.authenticator.verify("not-a-jwt");
    expect(isErr(verifyResult)).toBe(true);
    if (isErr(verifyResult)) {
      expect(verifyResult.error).toBeInstanceOf(UnauthorizedError);
    }
  });
});
