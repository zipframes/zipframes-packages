import { describe, expect, it } from "vitest";

import { z } from "zod";

import * as schemas from "../src/index.js";

describe("public package surface", () => {
  it("exports the shared helpers and service namespaces", () => {
    expect(Object.keys(schemas)).toEqual(
      expect.arrayContaining([
        "EVENT_EXCHANGE",
        "eventEnvelopeSchema",
        "parseSchema",
        "jsonSchemaOf",
        "authService",
        "videoService",
        "processorWorker",
      ]),
    );
  });
});

describe("jsonSchemaOf", () => {
  it("converts a Zod schema and drops $schema", () => {
    const generated = schemas.jsonSchemaOf(z.object({ name: z.string().min(1) }));

    expect(generated).not.toHaveProperty("$schema");
    expect(generated).toMatchObject({
      type: "object",
      required: ["name"],
      properties: { name: { type: "string", minLength: 1 } },
    });
  });
});
