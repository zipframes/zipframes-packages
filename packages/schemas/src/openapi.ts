import { z } from "zod";
import type { ZodType } from "zod";

/**
 * JSON Schema for OpenAPI, derived from a Zod schema a route already
 * validates with. `$schema` is dropped so Ajv (or another consumer) does
 * not try to resolve a draft URL.
 */
export const jsonSchemaOf = (schema: ZodType): Record<string, unknown> => {
  const generated = z.toJSONSchema(schema) as Record<string, unknown>;
  delete generated.$schema;
  return generated;
};
