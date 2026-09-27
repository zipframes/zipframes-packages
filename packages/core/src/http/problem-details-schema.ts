/**
 * JSON Schema for the {@link ProblemDetails} shape, framework-agnostic (no
 * Fastify, no Zod): every HTTP service documents its problem+json responses
 * with this same fragment, so it lives next to the runtime helpers instead
 * of being copied into each service.
 */
export const problemDetailsJsonSchema = {
  type: "object",
  required: ["type", "title", "status"],
  properties: {
    type: { type: "string" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
    correlationId: { type: "string" },
  },
};

/** An OpenAPI response object for one status code that answers problem+json. */
export const problemDetailsSchema = (description: string): Record<string, unknown> => ({
  description,
  content: {
    "application/problem+json": {
      schema: problemDetailsJsonSchema,
    },
  },
});
