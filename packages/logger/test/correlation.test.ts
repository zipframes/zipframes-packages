import { describe, expect, it } from "vitest";

import {
  createCorrelationId,
  getCorrelationId,
  runWithCorrelationId,
} from "../src/correlation/index.js";

describe("createCorrelationId", () => {
  it("returns a UUID string", () => {
    const id = createCorrelationId();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("returns a different id on each call", () => {
    expect(createCorrelationId()).not.toBe(createCorrelationId());
  });
});

describe("runWithCorrelationId", () => {
  it("exposes the id inside the callback and clears it afterwards", () => {
    expect(getCorrelationId()).toBeUndefined();

    const result = runWithCorrelationId("corr-1", () => {
      expect(getCorrelationId()).toBe("corr-1");
      return "ok";
    });

    expect(result).toBe("ok");
    expect(getCorrelationId()).toBeUndefined();
  });

  it("nests contexts without leaking the outer id", () => {
    runWithCorrelationId("outer", () => {
      expect(getCorrelationId()).toBe("outer");

      runWithCorrelationId("inner", () => {
        expect(getCorrelationId()).toBe("inner");
      });

      expect(getCorrelationId()).toBe("outer");
    });
  });

  it("propagates across awaited work in the same context", async () => {
    await runWithCorrelationId("async-corr", async () => {
      await Promise.resolve();
      expect(getCorrelationId()).toBe("async-corr");
    });
  });
});
