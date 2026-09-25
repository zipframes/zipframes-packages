/**
 * Where the error came from, so callers can decide how to handle it without
 * inspecting the class.
 *
 * - domain: a domain invariant was violated
 * - application: a use case rule stopped the operation
 * - infrastructure: a dependency failed
 */
export type ErrorKind = "domain" | "application" | "infrastructure";

export type BaseErrorOptions = {
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
};

/**
 * Base error for the packages and the services.
 *
 * Carries a stable, machine readable code, HTTP status, and optional details.
 */
export abstract class BaseError extends Error {
  abstract readonly kind: ErrorKind;

  readonly code: string;
  readonly statusCode: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: string, message: string, statusCode: number, options: BaseErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = options.details;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      kind: this.kind,
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

/** Narrows an unknown value to BaseError. */
export const isBaseError = (value: unknown): value is BaseError => value instanceof BaseError;
