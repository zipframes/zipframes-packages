import { describe, expect, it } from "vitest";

import { createReadinessCheck } from "../src/readiness/index.js";
import { PROBLEM_CONTENT_TYPE, problemDetails } from "../src/http/index.js";
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
