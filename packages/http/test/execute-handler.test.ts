import { describe, expect, it } from "vitest";

import { ConflictError, NotFoundError } from "@zipframes/core/errors";
import { err, ok } from "@zipframes/core/result";
import type { ProblemDetails } from "@zipframes/core/http";

import { executeHandler } from "../src/execute-handler.js";

const ctx = { correlationId: "corr-execute" };

describe("executeHandler", () => {
  it("returns success for an ok Result", async () => {
    const result = await executeHandler(async () => ok({ id: "1" }), undefined, ctx);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.value).toEqual({ id: "1" });
    }
  });

  it("returns a reply for an err Result", async () => {
    const result = await executeHandler(
      async () => err(new NotFoundError("USER_NOT_FOUND", "missing")),
      undefined,
      ctx,
    );

    expect(result.kind).toBe("reply");
    if (result.kind === "reply") {
      expect(result.reply.status).toBe(404);
      expect((result.reply.body as ProblemDetails).title).toBe("missing");
    }
  });

  it("returns a reply for a thrown BaseError", async () => {
    const result = await executeHandler(
      async () => {
        throw new ConflictError("EMAIL_TAKEN", "taken");
      },
      undefined,
      ctx,
    );

    expect(result.kind).toBe("reply");
    if (result.kind === "reply") {
      expect(result.reply.status).toBe(409);
    }
  });

  it("returns a generic 500 for unknown throws", async () => {
    const result = await executeHandler(
      async () => {
        throw new Error("secret driver message");
      },
      undefined,
      ctx,
    );

    expect(result.kind).toBe("reply");
    if (result.kind === "reply") {
      expect(result.reply.status).toBe(500);
      expect(JSON.stringify(result.reply.body)).not.toContain("secret driver message");
    }
  });
});
