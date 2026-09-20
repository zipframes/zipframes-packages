import { describe, expect, it } from "vitest";

import * as telemetry from "../src/index.js";

describe("public package surface", () => {
  it("exports metrics and tracing helpers", () => {
    expect(Object.keys(telemetry)).toEqual(
      expect.arrayContaining([
        "createMetrics",
        "initTracing",
        "injectContext",
        "extractContext",
        "injectHttpContext",
        "extractHttpContext",
        "injectMessageContext",
        "extractMessageContext",
        "withSpan",
      ]),
    );
  });
});
