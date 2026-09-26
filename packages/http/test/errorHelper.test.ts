import { describe, expect, it } from "vitest";

import { ConflictError, ValidationError } from "@zipframes/core/errors";
import { PROBLEM_CONTENT_TYPE, problemResponse, type ProblemDetails } from "@zipframes/core/http";

import {
  defaultErrorHelper,
  internalServerErrorReply,
  mapThrownValue,
  resolveError,
} from "../src/errorHelper.js";

const ctx = { correlationId: "corr-error-helper" };

describe("defaultErrorHelper", () => {
  it("maps BaseError to problem+json with status and message", () => {
    const reply = defaultErrorHelper(new ConflictError("EMAIL_TAKEN", "email taken"), ctx);

    expect(reply.status).toBe(409);
    expect(reply.contentType).toBe(PROBLEM_CONTENT_TYPE);
    expect((reply.body as ProblemDetails).title).toBe("email taken");
    expect((reply.body as ProblemDetails).detail).toBeUndefined();
  });
});

describe("internalServerErrorReply", () => {
  it("returns a generic 500 without detail", () => {
    const reply = internalServerErrorReply(ctx.correlationId);

    expect(reply.status).toBe(500);
    expect((reply.body as ProblemDetails).title).toBe("Internal server error");
    expect((reply.body as ProblemDetails).detail).toBeUndefined();
  });
});

describe("resolveError", () => {
  it("delegates to a custom error helper when provided", () => {
    const reply = resolveError(
      new ValidationError("SCHEMA_VALIDATION_FAILED", "ignored"),
      ctx,
      (_error, helperCtx) =>
        problemResponse(401, "Invalid credentials", undefined, helperCtx.correlationId),
    );

    expect(reply.status).toBe(401);
    expect((reply.body as ProblemDetails).title).toBe("Invalid credentials");
  });
});

describe("mapThrownValue", () => {
  it("maps thrown BaseError instances", () => {
    const reply = mapThrownValue(new ConflictError("EMAIL_TAKEN", "taken"), ctx);
    expect(reply.status).toBe(409);
  });

  it("maps unknown throws to a generic 500", () => {
    const reply = mapThrownValue(new Error("secret driver message"), ctx);

    expect(reply.status).toBe(500);
    expect(JSON.stringify(reply.body)).not.toContain("secret driver message");
  });
});
