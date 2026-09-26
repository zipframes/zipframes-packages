import { beforeAll, describe, expect, it } from "vitest";

import { UnauthorizedError } from "@zipframes/core/errors";
import { isErr } from "@zipframes/core/result";

import { authenticate } from "../src/authenticate.js";
import { buildAuthFixture, type AuthFixture } from "./helpers/auth-fixture.js";

const correlationId = "corr-auth";

describe("authenticate", () => {
  let authFixture: AuthFixture;

  beforeAll(async () => {
    authFixture = await buildAuthFixture();
  });

  it("returns authenticated context for a valid token", async () => {
    const token = await authFixture.sign({ sub: "user-42" });
    const result = await authenticate(`Bearer ${token}`, authFixture.authenticator, {
      correlationId,
    });

    expect(result.kind).toBe("authenticated");
    if (result.kind === "authenticated") {
      expect(result.context.claims.sub).toBe("user-42");
      expect(result.context.correlationId).toBe(correlationId);
    }
  });

  it("returns a reply when the bearer token is missing", async () => {
    const result = await authenticate(undefined, authFixture.authenticator, { correlationId });

    expect(result.kind).toBe("reply");
    if (result.kind === "reply") {
      expect(result.reply.status).toBe(401);
    }
  });

  it("returns a reply when token verification fails", async () => {
    const result = await authenticate("Bearer not-a-jwt", authFixture.authenticator, {
      correlationId,
    });

    expect(result.kind).toBe("reply");
    if (result.kind === "reply") {
      expect(result.reply.status).toBe(401);
    }
  });

  it("forwards verify UnauthorizedError codes", async () => {
    const verifyResult = await authFixture.authenticator.verify("not-a-jwt");
    expect(isErr(verifyResult)).toBe(true);
    if (isErr(verifyResult)) {
      expect(verifyResult.error).toBeInstanceOf(UnauthorizedError);
    }
  });
});
