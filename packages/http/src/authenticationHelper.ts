import type { Authenticator } from "@zipframes/authenticator";
import { UnauthorizedError } from "@zipframes/core/errors";
import { isErr } from "@zipframes/core/result";

import { resolveError } from "./errorHelper.js";
import type {
  AuthenticatedHandlerContext,
  ErrorHelper,
  HandlerContext,
  HttpReply,
} from "./types.js";

export type AuthenticationResult =
  | { readonly kind: "authenticated"; readonly context: AuthenticatedHandlerContext }
  | { readonly kind: "reply"; readonly reply: HttpReply };

export const authenticate = async (
  authorization: string | undefined,
  authenticator: Authenticator,
  ctx: HandlerContext,
  errorHelper?: ErrorHelper,
): Promise<AuthenticationResult> => {
  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return {
      kind: "reply",
      reply: resolveError(
        new UnauthorizedError("AUTH_MISSING_TOKEN", "authorization header is missing"),
        ctx,
        errorHelper,
      ),
    };
  }

  const verifyResult = await authenticator.verify(token);
  if (isErr(verifyResult)) {
    return { kind: "reply", reply: resolveError(verifyResult.error, ctx, errorHelper) };
  }

  return {
    kind: "authenticated",
    context: { correlationId: ctx.correlationId, claims: verifyResult.value },
  };
};
