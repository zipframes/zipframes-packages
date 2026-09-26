import { describe, expect, it } from "vitest";

import { isErr, isOk } from "@zipframes/core/result";

import { parseBearerToken } from "../src/parse-bearer.js";

describe("parseBearerToken", () => {
  it("returns the token from a valid Bearer header", () => {
    const result = parseBearerToken("Bearer eyJhbGciOiJSUzI1NiJ9.test");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("eyJhbGciOiJSUzI1NiJ9.test");
    }
  });

  it("rejects a missing authorization header", () => {
    const result = parseBearerToken(undefined);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_MISSING_TOKEN");
    }
  });

  it("rejects an empty authorization header", () => {
    const result = parseBearerToken("   ");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_MISSING_TOKEN");
    }
  });

  it("rejects a non-Bearer scheme", () => {
    const result = parseBearerToken("Basic abc");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_MISSING_TOKEN");
      expect(result.error.message).toContain("Bearer");
    }
  });

  it("rejects an empty bearer value", () => {
    const result = parseBearerToken("Bearer ");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("AUTH_MISSING_TOKEN");
    }
  });
});
