import { describe, expect, it } from "vitest";

import * as http from "../src/index.js";

describe("public package surface", () => {
  it("exports handler factories and HTTP types", () => {
    expect(Object.keys(http)).toEqual(
      expect.arrayContaining(["defineHandler", "defineAuthenticatedHandler"]),
    );
  });
});
