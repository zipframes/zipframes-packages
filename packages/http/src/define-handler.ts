import type { Authenticator, VerifiedClaims } from "@zipframes/authenticator";
import type { BaseError } from "@zipframes/core/errors";
import { UnauthorizedError, isBaseError } from "@zipframes/core/errors";
import { problemResponse } from "@zipframes/core/http";
import { err, isErr, ok } from "@zipframes/core/result";
import type { Result } from "@zipframes/core/result";
import type { z } from "zod";

import { parseSchema } from "./parse-schema.js";

/** Request decodificado que o adapter entrega ao handler, sem tipos de framework. */
export interface HttpRequest {
  readonly body: unknown;
  readonly correlationId: string;
  readonly authorization?: string;
}

/** Resposta HTTP que o adapter envia ao cliente. */
export interface HttpReply {
  readonly status: number;
  readonly body: unknown;
  readonly contentType?: string;
}

/** Contexto base de toda execução de handler. */
export interface HandlerContext {
  readonly correlationId: string;
}

/** Contexto quando a rota exige JWT válido. */
export interface AuthenticatedHandlerContext extends HandlerContext {
  readonly claims: VerifiedClaims;
}

export type ErrorHelper = (error: BaseError, ctx: HandlerContext) => HttpReply;

const internalServerError = (correlationId: string): HttpReply =>
  problemResponse(500, "Internal server error", undefined, correlationId);

const defaultErrorHelper: ErrorHelper = (error, ctx) =>
  problemResponse(error.statusCode, error.message, undefined, ctx.correlationId);

const resolveError = (
  error: BaseError,
  ctx: HandlerContext,
  errorHelper?: ErrorHelper,
): HttpReply => (errorHelper ?? defaultErrorHelper)(error, ctx);

const parseBearerToken = (authorization: string | undefined): Result<string, UnauthorizedError> => {
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

const asHandlerResult = <TValue>(
  value: Result<TValue, BaseError> | TValue,
): Result<TValue, BaseError> => {
  if (typeof value === "object" && value !== null && "ok" in value) {
    const candidate = value as Result<TValue, BaseError>;
    if (candidate.ok === true && "value" in candidate) {
      return candidate;
    }
    if (candidate.ok === false && "error" in candidate) {
      return candidate;
    }
  }

  return ok(value as TValue);
};

type BaseHandlerConfig<TInput, TOutput, TStatus extends number> = {
  readonly inputSchema: z.ZodType<TInput>;
  readonly outputSchema: z.ZodType<TOutput>;
  readonly successStatus: TStatus;
  readonly errorHelper?: ErrorHelper;
};

type HandlerConfigWithoutAuth<TInput, TOutput, TStatus extends number> = BaseHandlerConfig<
  TInput,
  TOutput,
  TStatus
> & {
  readonly authenticator?: never;
  readonly handler: (
    input: TInput,
    ctx: HandlerContext,
  ) => Promise<Result<TOutput, BaseError> | TOutput>;
};

type HandlerConfigWithAuth<TInput, TOutput, TStatus extends number> = BaseHandlerConfig<
  TInput,
  TOutput,
  TStatus
> & {
  readonly authenticator: Authenticator;
  readonly handler: (
    input: TInput,
    ctx: AuthenticatedHandlerContext,
  ) => Promise<Result<TOutput, BaseError> | TOutput>;
};

const runPipeline = async <TInput, TOutput, TStatus extends number>(
  config: BaseHandlerConfig<TInput, TOutput, TStatus> & {
    readonly handler: (
      input: TInput,
      ctx: HandlerContext | AuthenticatedHandlerContext,
    ) => Promise<Result<TOutput, BaseError> | TOutput>;
  },
  request: HttpRequest,
  ctx: HandlerContext | AuthenticatedHandlerContext,
  errorHelper?: ErrorHelper,
): Promise<HttpReply> => {
  const inputResult = parseSchema(config.inputSchema, request.body);
  if (isErr(inputResult)) {
    return resolveError(inputResult.error, ctx, errorHelper);
  }

  let handlerValue: TOutput;
  try {
    const result = await config.handler(inputResult.value, ctx);
    const unwrapped = asHandlerResult(result);
    if (isErr(unwrapped)) {
      return resolveError(unwrapped.error, ctx, errorHelper);
    }
    handlerValue = unwrapped.value;
  } catch (error) {
    if (isBaseError(error)) {
      return resolveError(error, ctx, errorHelper);
    }
    return internalServerError(ctx.correlationId);
  }

  const outputResult = parseSchema(config.outputSchema, handlerValue);
  if (isErr(outputResult)) {
    return internalServerError(ctx.correlationId);
  }

  return { status: config.successStatus, body: outputResult.value };
};

export function defineHandler<TInput, TOutput, TStatus extends number>(
  config: HandlerConfigWithAuth<TInput, TOutput, TStatus>,
): (request: HttpRequest) => Promise<HttpReply>;
export function defineHandler<TInput, TOutput, TStatus extends number>(
  config: HandlerConfigWithoutAuth<TInput, TOutput, TStatus>,
): (request: HttpRequest) => Promise<HttpReply>;
export function defineHandler<TInput, TOutput, TStatus extends number>(
  config:
    | HandlerConfigWithoutAuth<TInput, TOutput, TStatus>
    | HandlerConfigWithAuth<TInput, TOutput, TStatus>,
): (request: HttpRequest) => Promise<HttpReply> {
  return async (request: HttpRequest): Promise<HttpReply> => {
    const ctx: HandlerContext = { correlationId: request.correlationId };
    const errorHelper = config.errorHelper;

    if ("authenticator" in config) {
      const tokenResult = parseBearerToken(request.authorization);
      if (isErr(tokenResult)) {
        return resolveError(tokenResult.error, ctx, errorHelper);
      }

      const verifyResult = await config.authenticator.verify(tokenResult.value);
      if (isErr(verifyResult)) {
        return resolveError(verifyResult.error, ctx, errorHelper);
      }

      const authCtx: AuthenticatedHandlerContext = { ...ctx, claims: verifyResult.value };
      return runPipeline(
        config as BaseHandlerConfig<TInput, TOutput, TStatus> & {
          readonly handler: (
            input: TInput,
            ctx: HandlerContext | AuthenticatedHandlerContext,
          ) => Promise<Result<TOutput, BaseError> | TOutput>;
        },
        request,
        authCtx,
        errorHelper,
      );
    }

    return runPipeline(config, request, ctx, errorHelper);
  };
}
