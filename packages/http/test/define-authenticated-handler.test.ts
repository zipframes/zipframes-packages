import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { ok } from "@zipframes/core/result";

import { defineAuthenticatedHandler } from "../src/define-handler.js";
import { buildAuthFixture, type AuthFixture } from "./helpers/auth-fixture.js";

const correlationId = "corr-define-authenticated-handler";

describe("defineAuthenticatedHandler", () => {
  let authFixture: AuthFixture;

  beforeAll(async () => {
    authFixture = await buildAuthFixture();
  });

  it("passes verified claims to the handler", async () => {
    const handler = defineAuthenticatedHandler({
      inputSchema: z.object({}),
      outputSchema: z.object({ ownerId: z.string() }),
      successStatus: 200,
      authenticator: authFixture.authenticator,
      handler: async (_input, ctx) => ok({ ownerId: ctx.claims.sub }),
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
    const handler = defineAuthenticatedHandler({
      inputSchema: z.object({ required: z.literal(true) }),
      outputSchema: z.object({ ok: z.literal(true) }),
      successStatus: 200,
      authenticator: authFixture.authenticator,
      handler: async () => {
        bodyValidated = true;
        return ok({ ok: true as const });
      },
    });

    const reply = await handler({ body: {}, correlationId });

    expect(bodyValidated).toBe(false);
    expect(reply.status).toBe(401);
  });
});
