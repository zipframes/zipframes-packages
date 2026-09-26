import { UnauthorizedError } from "@zipframes/core/errors";
import { err, ok } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";

export const parseBearerToken = (
  authorization: string | undefined,
): Result<string, UnauthorizedError> => {
  if (authorization === undefined || authorization.trim().length === 0) {
    return err(new UnauthorizedError("AUTH_MISSING_TOKEN", "authorization header is missing"));
  }

  const parts = authorization.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer" || parts[1]?.length === 0) {
    return err(
      new UnauthorizedError("AUTH_MISSING_TOKEN", "authorization header must be a Bearer token"),
    );
  }

  return ok(parts[1]!);
};
