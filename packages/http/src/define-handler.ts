import type { BaseError } from "@zipframes/core/errors";
import { isErr } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";
import type { z } from "zod";

import { authenticate } from "./authenticate.js";
import { executeHandler } from "./execute-handler.js";
import { internalServerErrorReply, resolveError } from "./map-error.js";
import { parseSchema } from "./parse-schema.js";
import type {
  AuthenticatedHandlerConfig,
  ErrorHelper,
  HandlerConfig,
  HandlerContext,
  HttpReply,
  HttpRequest,
} from "./types.js";

const buildSuccessReply = <TOutput, TStatus extends number>(
  successStatus: TStatus,
  body: TOutput,
): HttpReply => ({ status: successStatus, body });

const handleValidatedPipeline = async <
  TInput,
  TOutput,
  TStatus extends number,
  TContext extends HandlerContext,
>(
  config: {
    readonly inputSchema: z.ZodType<TInput>;
    readonly outputSchema: z.ZodType<TOutput>;
    readonly successStatus: TStatus;
    readonly errorHelper?: ErrorHelper;
    readonly handler: (input: TInput, ctx: TContext) => Promise<Result<TOutput, BaseError>>;
  },
  request: HttpRequest,
  ctx: TContext,
): Promise<HttpReply> => {
  const inputResult = parseSchema(config.inputSchema, request.body);
  if (isErr(inputResult)) {
    return resolveError(inputResult.error, ctx, config.errorHelper);
  }

  const execution = await executeHandler(
    config.handler,
    inputResult.value,
    ctx,
    config.errorHelper,
  );
  if (execution.kind === "reply") {
    return execution.reply;
  }

  const outputResult = parseSchema(config.outputSchema, execution.value);
  if (isErr(outputResult)) {
    return internalServerErrorReply(ctx.correlationId);
  }

  return buildSuccessReply(config.successStatus, outputResult.value);
};

export const defineHandler = <TInput, TOutput, TStatus extends number>(
  config: HandlerConfig<TInput, TOutput, TStatus>,
): ((request: HttpRequest) => Promise<HttpReply>) => {
  return (request) => {
    const ctx: HandlerContext = { correlationId: request.correlationId };
    return handleValidatedPipeline(config, request, ctx);
  };
};

export const defineAuthenticatedHandler = <TInput, TOutput, TStatus extends number>(
  config: AuthenticatedHandlerConfig<TInput, TOutput, TStatus>,
): ((request: HttpRequest) => Promise<HttpReply>) => {
  return async (request) => {
    const ctx: HandlerContext = { correlationId: request.correlationId };
    const authentication = await authenticate(
      request.authorization,
      config.authenticator,
      ctx,
      config.errorHelper,
    );

    if (authentication.kind === "reply") {
      return authentication.reply;
    }

    return handleValidatedPipeline(config, request, authentication.context);
  };
};
