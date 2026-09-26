import type { BaseError } from "@zipframes/core/errors";
import { isErr } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";

import { mapThrownValue, resolveError } from "./errorHelper.js";
import type { ErrorHelper, HandlerContext, HttpReply } from "./types.js";

export type HandlerExecutionResult<TOutput> =
  | { readonly kind: "success"; readonly value: TOutput }
  | { readonly kind: "reply"; readonly reply: HttpReply };

export const executeHandler = async <TInput, TOutput, TContext extends HandlerContext>(
  handler: (input: TInput, ctx: TContext) => Promise<Result<TOutput, BaseError>>,
  input: TInput,
  ctx: TContext,
  errorHelper?: ErrorHelper,
): Promise<HandlerExecutionResult<TOutput>> => {
  try {
    const result = await handler(input, ctx);
    if (isErr(result)) {
      return { kind: "reply", reply: resolveError(result.error, ctx, errorHelper) };
    }

    return { kind: "success", value: result.value };
  } catch (error) {
    return { kind: "reply", reply: mapThrownValue(error, ctx, errorHelper) };
  }
};
