import { describe, expect, it } from "vitest";

import * as toolkit from "../src/index.js";

describe("public package surface", () => {
  it("exports containers and the in-memory broker", () => {
    expect(Object.keys(toolkit)).toEqual(
      expect.arrayContaining([
        "startPostgres",
        "startRabbitMq",
        "startRedis",
        "startS3",
        "createInMemoryBroker",
      ]),
    );
  });
});
