import type { Authenticator } from "@zipframes/authenticator";
import type { VerifiedClaims } from "@zipframes/authenticator";
import type { BaseError } from "@zipframes/core/errors";
import type { Result } from "@zipframes/core/result";
import type { z } from "zod";

export interface HttpRequest {
  readonly body: unknown;
  readonly correlationId: string;
  readonly authorization?: string;
}

export interface HttpReply {
  readonly status: number;
  readonly body: unknown;
  readonly contentType?: string;
}

export interface HandlerContext {
  readonly correlationId: string;
}

export interface AuthenticatedHandlerContext extends HandlerContext {
  readonly claims: VerifiedClaims;
}

export type ErrorHelper = (error: BaseError, ctx: HandlerContext) => HttpReply;

export type BaseHandlerConfig<TInput, TOutput, TStatus extends number> = {
  readonly inputSchema: z.ZodType<TInput>;
  readonly outputSchema: z.ZodType<TOutput>;
  readonly successStatus: TStatus;
  readonly errorHelper?: ErrorHelper;
};

export type HandlerConfig<TInput, TOutput, TStatus extends number> = BaseHandlerConfig<
  TInput,
  TOutput,
  TStatus
> & {
  readonly handler: (input: TInput, ctx: HandlerContext) => Promise<Result<TOutput, BaseError>>;
};

export type AuthenticatedHandlerConfig<TInput, TOutput, TStatus extends number> = BaseHandlerConfig<
  TInput,
  TOutput,
  TStatus
> & {
  readonly authenticator: Authenticator;
  readonly handler: (
    input: TInput,
    ctx: AuthenticatedHandlerContext,
  ) => Promise<Result<TOutput, BaseError>>;
};
