import { describe, expect, it } from "vitest";

import * as schemas from "../src/index.js";

describe("public package surface", () => {
  it("exports the shared helpers and service namespaces", () => {
    expect(Object.keys(schemas)).toEqual(
      expect.arrayContaining([
        "EVENT_EXCHANGE",
        "eventEnvelopeSchema",
        "parseSchema",
        "authService",
        "videoService",
        "processorWorker",
      ]),
    );
  });
});
