import { describe, expect, it } from "vitest";

import { computeBackoffMs, decideRetry } from "../src/retry/index.js";

describe("computeBackoffMs", () => {
  it("grows exponentially and caps at maxDelayMs", () => {
    const options = { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 1000, multiplier: 2 };
    expect(computeBackoffMs(1, options)).toBe(100);
    expect(computeBackoffMs(2, options)).toBe(200);
    expect(computeBackoffMs(3, options)).toBe(400);
    expect(computeBackoffMs(5, options)).toBe(1000);
  });

  it("defaults the multiplier to 2", () => {
    expect(computeBackoffMs(3, { maxAttempts: 5, baseDelayMs: 10, maxDelayMs: 10_000 })).toBe(40);
  });

  it("rejects non-positive attempts", () => {
    expect(() => computeBackoffMs(0, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 })).toThrow(
      RangeError,
    );
  });
});

describe("decideRetry", () => {
  it("retries until maxAttempts then routes to the DLQ", () => {
    const options = { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 };
    expect(decideRetry(1, options)).toBe("retry");
    expect(decideRetry(2, options)).toBe("retry");
    expect(decideRetry(3, options)).toBe("dlq");
  });

  it("rejects non-positive attempts", () => {
    expect(() => decideRetry(0, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 })).toThrow(
      RangeError,
    );
  });
});
