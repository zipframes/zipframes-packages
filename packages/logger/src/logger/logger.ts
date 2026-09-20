import pino from "pino";
import type { DestinationStream, Logger as PinoLogger } from "pino";

import { getCorrelationId } from "../correlation/index.js";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const DEFAULT_REDACT = [
  "password",
  "token",
  "secret",
  "authorization",
  "accessToken",
  "refreshToken",
  "*.password",
  "*.token",
  "*.secret",
] as const;

export type LoggerOptions = {
  readonly service: string;
  readonly version: string;
  readonly level?: LogLevel;
  readonly redact?: readonly string[];
  readonly destination?: DestinationStream;
};

export type LogFields = Record<string, unknown>;

export type Logger = {
  readonly debug: (message: string, fields?: LogFields) => void;
  readonly info: (message: string, fields?: LogFields) => void;
  readonly warn: (message: string, fields?: LogFields) => void;
  readonly error: (message: string, fields?: LogFields) => void;
  readonly child: (bindings: LogFields) => Logger;
};

const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

const wrap = (pinoLogger: PinoLogger): Logger => {
  const write =
    (level: LogLevel) =>
    (message: string, fields: LogFields = {}): void => {
      pinoLogger[level](fields, message);
    };

  return {
    debug: write("debug"),
    info: write("info"),
    warn: write("warn"),
    error: write("error"),
    child: (bindings) => wrap(pinoLogger.child(bindings)),
  };
};

/**
 * Builds a JSON logger that always emits `service`, `version` and, when one
 * is in scope, `correlationId`. Sensitive keys are redacted by default.
 */
export const createLogger = (options: LoggerOptions): Logger => {
  const level = options.level ?? "info";
  if (!isLogLevel(level)) {
    throw new Error(`unsupported log level: ${level}`);
  }

  const pinoLogger = pino(
    {
      level,
      base: {
        service: options.service,
        version: options.version,
      },
      mixin: () => {
        const correlationId = getCorrelationId();
        return correlationId === undefined ? {} : { correlationId };
      },
      redact: {
        paths: [...(options.redact ?? DEFAULT_REDACT)],
        censor: "[Redacted]",
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    options.destination,
  );

  return wrap(pinoLogger);
};
