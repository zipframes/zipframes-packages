import { describe, expect, it } from "vitest";

import { createReadinessCheck } from "../src/readiness/index.js";
import * as pingable from "../src/readiness/pingable.js";
import { PROBLEM_CONTENT_TYPE, problemDetails, problemResponse } from "../src/http/index.js";
import type { ProblemDetails } from "../src/http/index.js";
import { ApplicationError, InfrastructureError, isRetryableError } from "../src/errors/index.js";

describe("createReadinessCheck", () => {
  it("returns ready when every check succeeds", async () => {
    const check = createReadinessCheck([
      { ping: async () => undefined },
      { ping: async () => undefined },
    ]);

    await expect(check()).resolves.toEqual({ ready: true });
  });

  it("returns the first failure reason", async () => {
    const check = createReadinessCheck([
      { ping: async () => undefined },
      {
        ping: async () => {
          throw new Error("amqp disconnected");
        },
      },
      {
        ping: async () => {
          throw new Error("should not run");
        },
      },
    ]);

    await expect(check()).resolves.toEqual({
      ready: false,
      reason: "amqp disconnected",
    });
  });

  it("uses unknown when a check rejects with a non-error", async () => {
    const check = createReadinessCheck([
      {
        ping: async () => {
          throw "down";
        },
      },
    ]);

    await expect(check()).resolves.toEqual({ ready: false, reason: "unknown" });
  });

  it("exports Pingable as a type with no runtime value", () => {
    expect(Object.keys(pingable)).toEqual([]);
  });
});

describe("problemDetails", () => {
  it("builds an RFC 9457 payload", () => {
    expect(problemDetails(400, "Bad request", "why", "corr-1")).toEqual({
      type: "about:blank",
      status: 400,
      title: "Bad request",
      detail: "why",
      correlationId: "corr-1",
    });
    expect(PROBLEM_CONTENT_TYPE).toBe("application/problem+json");
  });

  it("omits detail and correlationId when they are absent", () => {
    expect(problemDetails(503, "Unavailable")).toEqual({
      type: "about:blank",
      status: 503,
      title: "Unavailable",
    });
  });
});

describe("problemResponse", () => {
  it("wraps the payload in an HTTP problem envelope", () => {
    expect(problemResponse(409, "Email already registered", "already in use", "corr-1")).toEqual({
      status: 409,
      contentType: PROBLEM_CONTENT_TYPE,
      body: {
        type: "about:blank",
        status: 409,
        title: "Email already registered",
        detail: "already in use",
        correlationId: "corr-1",
      },
    });
  });

  it("omits detail when there is none", () => {
    expect(problemResponse(401, "Unauthorized", undefined, "corr-2").body).toEqual({
      type: "about:blank",
      status: 401,
      title: "Unauthorized",
      correlationId: "corr-2",
    });
  });

  it("keeps the numeric literal so it fits a status union member", () => {
    type Response =
      | { status: 400; contentType: string; body: ProblemDetails }
      | { status: 409; contentType: string; body: ProblemDetails };

    const conflict: Response = problemResponse(409, "Email already registered", "x", "corr-3");

    // @ts-expect-error 404 is not a member of the response union
    const notFound: Response = problemResponse(404, "Not found", "x", "corr-4");

    expect(conflict.status).toBe(409);
    expect(notFound.status).toBe(404);
  });
});

describe("isRetryableError", () => {
  it("reads retryable from InfrastructureError", () => {
    expect(isRetryableError(new InfrastructureError("X", "y", { retryable: false }))).toBe(false);
    expect(isRetryableError(new InfrastructureError("X", "y"))).toBe(true);
  });

  it("treats other BaseErrors as not retryable and unknowns as retryable", () => {
    expect(isRetryableError(new ApplicationError("X", "y"))).toBe(false);
    expect(isRetryableError(new Error("boom"))).toBe(true);
  });
});
