import { describe, expect, it } from "vitest";

import * as communication from "../src/index.js";

describe("public package surface", () => {
  it("exports publisher, consumer, retry and topology helpers", () => {
    expect(Object.keys(communication)).toEqual(
      expect.arrayContaining([
        "computeBackoffMs",
        "decideRetry",
        "createDefaultTopology",
        "createPublisher",
        "createConsumer",
      ]),
    );
  });
});
