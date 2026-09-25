import { describe, expect, it } from "vitest";

import * as toolkit from "../src/index.js";

describe("public package surface", () => {
  it("exports container starters", () => {
    expect(Object.keys(toolkit).sort()).toEqual([
      "startPostgres",
      "startRabbitMq",
      "startRedis",
      "startS3",
    ]);
  });
});
