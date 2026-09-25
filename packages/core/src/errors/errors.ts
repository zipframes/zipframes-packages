import { BaseError } from "./base-error.js";
import type { BaseErrorOptions, ErrorKind } from "./base-error.js";

/**
 * A domain invariant was violated: an email with an invalid format, a status
 * transition the state machine does not allow.
 */
export class DomainError extends BaseError {
  readonly kind: ErrorKind = "domain";

  constructor(code: string, message: string, options: BaseErrorOptions = {}) {
    super(code, message, 400, options);
  }
}

/**
 * A use case rule stopped the operation: a missing resource, a conflict with
 * the current state, a missing permission.
 */
export class ApplicationError extends BaseError {
  readonly kind: ErrorKind = "application";

  constructor(code: string, message: string, options: BaseErrorOptions = {}, statusCode = 400) {
    super(code, message, statusCode, options);
  }
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
    statusCode = 500,
  ) {
    super(code, message, statusCode, options);
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
export class NotFoundError extends ApplicationError {
  constructor(code: string, message: string, options: BaseErrorOptions = {}) {
    super(code, message, options, 404);
  }
}

/** The operation clashes with the current state, such as confirming an upload twice. */
export class ConflictError extends ApplicationError {
  constructor(code: string, message: string, options: BaseErrorOptions = {}) {
    super(code, message, options, 409);
  }
}

/** No valid identity was presented. */
export class UnauthorizedError extends ApplicationError {
  constructor(code: string, message: string, options: BaseErrorOptions = {}) {
    super(code, message, options, 401);
  }
}

/** The identity is valid but is not allowed to perform the operation. */
export class ForbiddenError extends ApplicationError {
  constructor(code: string, message: string, options: BaseErrorOptions = {}) {
    super(code, message, options, 403);
  }
}

/** A deadline was exceeded. Retryable by default. */
export class TimeoutError extends InfrastructureError {
  constructor(
    code: string,
    message: string,
    options: BaseErrorOptions & { readonly retryable?: boolean } = {},
  ) {
    super(code, message, options, 504);
  }
}

/** A dependency is unreachable or refusing work. Retryable by default. */
export class UnavailableError extends InfrastructureError {
  constructor(
    code: string,
    message: string,
    options: BaseErrorOptions & { readonly retryable?: boolean } = {},
  ) {
    super(code, message, options, 503);
  }
}

/**
 * An unexpected failure inside the service or one of its dependencies.
 * Not retryable by default.
 */
export class InternalServerError extends InfrastructureError {
  constructor(
    code: string,
    message: string,
    options: BaseErrorOptions & { readonly retryable?: boolean } = {},
  ) {
    super(code, message, { ...options, retryable: options.retryable ?? false }, 500);
  }
}
