import { UnauthorizedError } from "@zipframes/core/errors";
import { err, ok } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";

export const parseBearerToken = (
  authorization: string | undefined,
): Result<string, UnauthorizedError> => {
  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return err(new UnauthorizedError("AUTH_MISSING_TOKEN", "authorization header is missing"));
  }

  return ok(token);
};
