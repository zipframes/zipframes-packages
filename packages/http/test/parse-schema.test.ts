import { describe, expect, it } from "vitest";
import { z } from "zod";

import { isErr, isOk } from "@zipframes/core/result";

import { parseSchema } from "../src/parse-schema.js";

describe("parseSchema", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("returns parsed data for valid input", () => {
    const result = parseSchema(schema, { name: "Hellen" });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe("Hellen");
    }
  });

  it("returns ValidationError for invalid input", () => {
    const result = parseSchema(schema, { name: "" });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("SCHEMA_VALIDATION_FAILED");
    }
  });
});
