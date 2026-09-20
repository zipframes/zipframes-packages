import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { runWithCorrelationId } from "../src/correlation/index.js";
import { createLogger, LOG_LEVELS } from "../src/logger/index.js";

type CapturedLine = Record<string, unknown>;

const captureDestination = (): {
  readonly lines: CapturedLine[];
  readonly stream: Writable;
} => {
  const lines: CapturedLine[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      const text = chunk.toString("utf8").trim();
      for (const line of text.split("\n").filter(Boolean)) {
        lines.push(JSON.parse(line) as CapturedLine);
      }
      callback();
    },
  });

  return { lines, stream };
};

describe("LOG_LEVELS", () => {
  it("lists the supported levels", () => {
    expect(LOG_LEVELS).toEqual(["debug", "info", "warn", "error"]);
  });
});

describe("createLogger", () => {
  it("emits JSON with service, version, level, message and timestamp", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      level: "info",
      destination: stream,
    });

    logger.info("hello", { userId: "u-1" });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: 30,
      service: "auth-service",
      version: "1.0.0",
      msg: "hello",
      userId: "u-1",
    });
    expect(typeof lines[0]?.time).toBe("string");
  });

  it("includes correlationId when one is in scope", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      destination: stream,
    });

    runWithCorrelationId("corr-42", () => {
      logger.info("with correlation");
    });

    expect(lines[0]).toMatchObject({
      correlationId: "corr-42",
      msg: "with correlation",
    });
  });

  it("omits correlationId when none is in scope", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      destination: stream,
    });

    logger.info("no correlation");

    expect(lines[0]).not.toHaveProperty("correlationId");
  });

  it("redacts sensitive fields by default", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      destination: stream,
    });

    logger.info("secrets", {
      password: "hunter2",
      token: "abc",
      nested: { secret: "shh" },
    });

    expect(lines[0]).toMatchObject({
      password: "[Redacted]",
      token: "[Redacted]",
      nested: { secret: "[Redacted]" },
    });
  });

  it("accepts extra redact paths", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      destination: stream,
      redact: ["ssn", "*.ssn"],
    });

    logger.info("custom", { ssn: "123", other: "visible" });

    expect(lines[0]).toMatchObject({
      ssn: "[Redacted]",
      other: "visible",
    });
  });

  it("respects the configured level", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      level: "warn",
      destination: stream,
    });

    logger.debug("skipped");
    logger.info("skipped");
    logger.warn("kept");
    logger.error("kept too");

    expect(lines.map((line) => line.msg)).toEqual(["kept", "kept too"]);
  });

  it("creates a child logger that inherits bindings", () => {
    const { lines, stream } = captureDestination();
    const logger = createLogger({
      service: "auth-service",
      version: "1.0.0",
      destination: stream,
    });

    logger.child({ requestId: "r-1" }).info("child message");

    expect(lines[0]).toMatchObject({
      requestId: "r-1",
      msg: "child message",
      service: "auth-service",
    });
  });

  it("rejects an unsupported log level", () => {
    expect(() =>
      createLogger({
        service: "auth-service",
        version: "1.0.0",
        level: "trace" as unknown as "info",
      }),
    ).toThrow(/unsupported log level/);
  });
});
