import { describe, expect, it } from "vitest";
import { z } from "zod";

import { NotFoundError } from "@zipframes/core/errors";
import { PROBLEM_CONTENT_TYPE, type ProblemDetails } from "@zipframes/core/http";
import { err, ok } from "@zipframes/core/result";

import { defineHandler } from "../src/define-handler.js";

const inputSchema = z.object({ name: z.string().min(1) });
const outputSchema = z.object({ id: z.string(), name: z.string() });
const correlationId = "corr-define-handler";

describe("defineHandler", () => {
  it("returns success with validated input and output", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 201,
      handler: async (input) => ok({ id: "user-1", name: input.name }),
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply).toEqual({
      status: 201,
      body: { id: "user-1", name: "Hellen" },
    });
    expect(reply.contentType).toBeUndefined();
  });

  it("maps input validation failures to problem+json", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async (input) => ok({ id: "1", name: input.name }),
    });

    const reply = await handler({ body: { name: "" }, correlationId });

    expect(reply.status).toBe(400);
    expect(reply.contentType).toBe(PROBLEM_CONTENT_TYPE);
    expect(reply.body).toEqual({
      type: "about:blank",
      status: 400,
      title: "value does not match the schema",
      correlationId,
    });
  });

  it("maps use-case Result errors through the default error helper", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async () => err(new NotFoundError("USER_NOT_FOUND", "user not found")),
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(404);
    expect((reply.body as ProblemDetails).title).toBe("user not found");
  });

  it("returns 500 when the handler output fails output schema validation", async () => {
    const handler = defineHandler({
      inputSchema,
      outputSchema,
      successStatus: 200,
      handler: async (input) =>
        ok({ id: 123, name: input.name } as unknown as z.infer<typeof outputSchema>),
    });

    const reply = await handler({ body: { name: "Hellen" }, correlationId });

    expect(reply.status).toBe(500);
    expect((reply.body as ProblemDetails).title).toBe("Internal server error");
  });

  it("does not expose claims on the handler context", async () => {
    const handler = defineHandler({
      inputSchema: z.object({}),
      outputSchema: z.object({ hasClaims: z.boolean() }),
      successStatus: 200,
      handler: async (_input, ctx) => ok({ hasClaims: "claims" in ctx }),
    });

    const reply = await handler({
      body: {},
      correlationId,
      authorization: "Bearer ignored-token",
    });

    expect(reply.body).toEqual({ hasClaims: false });
  });
});
