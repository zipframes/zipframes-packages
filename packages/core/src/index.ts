export type { Ok, Err, Result } from "./result/index.js";
export {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  andThen,
  unwrapOr,
  unwrapOrElse,
  match,
  all,
} from "./result/index.js";

export type { Brand, Unbrand } from "./branded/index.js";
export { brand } from "./branded/index.js";

export type { ErrorKind, BaseErrorOptions } from "./errors/index.js";
export {
  BaseError,
  isBaseError,
  DomainError,
  ApplicationError,
  InfrastructureError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TimeoutError,
  UnavailableError,
  InternalServerError,
  isRetryableError,
} from "./errors/index.js";

export type { Pingable, ReadinessResult } from "./readiness/index.js";
export { createReadinessCheck } from "./readiness/index.js";

export type { ProblemDetails } from "./http/index.js";
export { PROBLEM_CONTENT_TYPE, problemDetails, problemResponse } from "./http/index.js";
