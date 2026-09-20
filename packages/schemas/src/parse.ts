import { ValidationError } from "@zipframes/core/errors";
import { err, ok } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";
import type { z } from "zod";

/**
 * Parses an unknown value with a Zod schema, returning `Result` instead of
 * throwing. Used by adapters at the edge of each service.
 */
export const parseSchema = <TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): Result<z.infer<TSchema>, ValidationError> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return err(
      new ValidationError("SCHEMA_VALIDATION_FAILED", "value does not match the schema", {
        details: { issues: parsed.error.issues },
      }),
    );
  }
  return ok(parsed.data);
};
