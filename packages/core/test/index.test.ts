import { describe, expect, it } from "vitest";

import * as core from "../src/index.js";

describe("public package surface", () => {
  it("exports the Result helpers", () => {
    expect(Object.keys(core)).toEqual(
      expect.arrayContaining([
        "ok",
        "err",
        "isOk",
        "isErr",
        "map",
        "mapErr",
        "andThen",
        "unwrapOr",
        "unwrapOrElse",
        "match",
        "all",
      ]),
    );
  });

  it("exports the brand helper and the base errors", () => {
    expect(Object.keys(core)).toEqual(
      expect.arrayContaining([
        "brand",
        "BaseError",
        "isBaseError",
        "DomainError",
        "ApplicationError",
        "InfrastructureError",
        "ValidationError",
        "NotFoundError",
        "ConflictError",
        "UnauthorizedError",
        "ForbiddenError",
        "TimeoutError",
        "UnavailableError",
        "isRetryableError",
        "createReadinessCheck",
        "problemDetails",
        "PROBLEM_CONTENT_TYPE",
      ]),
    );
  });

  it("re-exports the same implementations as the inner modules", () => {
    const result = core.map(core.ok(2), (n) => n * 2);

    expect(result).toEqual({ ok: true, value: 4 });
    expect(new core.DomainError("X", "y")).toBeInstanceOf(core.BaseError);
  });
});

describe("subpath exports", () => {
  it("serves the same implementations as the package root", async () => {
    const [root, result, errors, branded] = await Promise.all([
      import("@zipframes/core"),
      import("@zipframes/core/result"),
      import("@zipframes/core/errors"),
      import("@zipframes/core/branded"),
    ]);

    expect(result.ok).toBe(root.ok);
    expect(errors.DomainError).toBe(root.DomainError);
    expect(branded.brand).toBe(root.brand);
  });

  it("keeps each subpath scoped to its own module", async () => {
    const result = await import("@zipframes/core/result");
    const errors = await import("@zipframes/core/errors");

    expect(Object.keys(result)).not.toContain("DomainError");
    expect(Object.keys(errors)).not.toContain("ok");
  });
});
