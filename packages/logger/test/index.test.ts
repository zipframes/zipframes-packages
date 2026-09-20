import { describe, expect, it } from "vitest";

import * as logger from "../src/index.js";

describe("public package surface", () => {
  it("exports the logger helpers", () => {
    expect(Object.keys(logger)).toEqual(
      expect.arrayContaining([
        "createLogger",
        "LOG_LEVELS",
        "createCorrelationId",
        "getCorrelationId",
        "runWithCorrelationId",
      ]),
    );
  });
});
