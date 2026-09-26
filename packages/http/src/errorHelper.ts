import type { BaseError } from "@zipframes/core/errors";
import { isBaseError } from "@zipframes/core/errors";
import { problemResponse } from "@zipframes/core/http";

import type { ErrorHelper, HandlerContext, HttpReply } from "./types.js";

export const internalServerErrorReply = (correlationId: string): HttpReply =>
  problemResponse(500, "Internal server error", undefined, correlationId);

export const defaultErrorHelper: ErrorHelper = (error, ctx) =>
  problemResponse(error.statusCode, error.message, undefined, ctx.correlationId);

export const resolveError = (
  error: BaseError,
  ctx: HandlerContext,
  errorHelper?: ErrorHelper,
): HttpReply => (errorHelper ?? defaultErrorHelper)(error, ctx);

export const mapThrownValue = (
  error: unknown,
  ctx: HandlerContext,
  errorHelper?: ErrorHelper,
): HttpReply => {
  if (isBaseError(error)) {
    return resolveError(error, ctx, errorHelper);
  }

  return internalServerErrorReply(ctx.correlationId);
};
