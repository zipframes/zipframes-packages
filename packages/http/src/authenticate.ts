import type { Authenticator } from "@zipframes/authenticator";
import { isErr } from "@zipframes/core/result";

import { parseBearerToken } from "./parse-bearer.js";
import { resolveError } from "./map-error.js";
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
  const tokenResult = parseBearerToken(authorization);
  if (isErr(tokenResult)) {
    return { kind: "reply", reply: resolveError(tokenResult.error, ctx, errorHelper) };
  }

  const verifyResult = await authenticator.verify(tokenResult.value);
  if (isErr(verifyResult)) {
    return { kind: "reply", reply: resolveError(verifyResult.error, ctx, errorHelper) };
  }

  return {
    kind: "authenticated",
    context: { correlationId: ctx.correlationId, claims: verifyResult.value },
  };
};
