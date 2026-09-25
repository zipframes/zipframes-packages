import { BaseError } from "./base-error.js";
import type { BaseErrorOptions, ErrorKind } from "./base-error.js";

/**
 * A domain invariant was violated: an email with an invalid format, a status
 * transition the state machine does not allow.
 */
export class DomainError extends BaseError {
  readonly kind: ErrorKind = "domain";
}

/**
 * A use case rule stopped the operation: a missing resource, a conflict with
 * the current state, a missing permission.
 */
export class ApplicationError extends BaseError {
  readonly kind: ErrorKind = "application";
}

/**
 * A dependency failed: database, broker, storage, network.
 *
 * `retryable` says whether trying again may succeed.
 */
export class InfrastructureError extends BaseError {
  readonly kind: ErrorKind = "infrastructure";
  readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    options: BaseErrorOptions & { readonly retryable?: boolean } = {},
  ) {
    super(code, message, options);
    this.retryable = options.retryable ?? true;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), retryable: this.retryable };
  }
}

/** A value did not pass validation: format, range, required field. */
export class ValidationError extends DomainError {}

/**
 * The resource does not exist, or does not exist for whoever asked.
 */
export class NotFoundError extends ApplicationError {}

/** The operation clashes with the current state, such as confirming an upload twice. */
export class ConflictError extends ApplicationError {}

/** No valid identity was presented. */
export class UnauthorizedError extends ApplicationError {}

/** The identity is valid but is not allowed to perform the operation. */
export class ForbiddenError extends ApplicationError {}

/** A deadline was exceeded. Retryable by default. */
export class TimeoutError extends InfrastructureError {}

/** A dependency is unreachable or refusing work. Retryable by default. */
export class UnavailableError extends InfrastructureError {}

/**
 * An unexpected failure inside the service or one of its dependencies.
 * Not retryable by default; adapters map it to HTTP 500 without leaking details.
 */
export class InternalServerError extends InfrastructureError {
  constructor(
    code: string,
    message: string,
    options: BaseErrorOptions & { readonly retryable?: boolean } = {},
  ) {
    super(code, message, { ...options, retryable: options.retryable ?? false });
  }
}
