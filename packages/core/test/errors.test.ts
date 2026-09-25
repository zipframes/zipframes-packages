import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  BaseError,
  ConflictError,
  DomainError,
  ForbiddenError,
  InfrastructureError,
  InternalServerError,
  isBaseError,
  NotFoundError,
  TimeoutError,
  UnauthorizedError,
  UnavailableError,
  ValidationError,
} from "../src/errors/index.js";

describe("DomainError", () => {
  it("holds code, message and origin", () => {
    const error = new DomainError("INVALID_EMAIL", "email has an invalid format");

    expect(error.code).toBe("INVALID_EMAIL");
    expect(error.message).toBe("email has an invalid format");
    expect(error.kind).toBe("domain");
    expect(error.name).toBe("DomainError");
  });

  it("is still an Error", () => {
    const error = new DomainError("X", "y");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
    expect(error.stack).toBeDefined();
  });
});

describe("kind per error type", () => {
  it("tells the three origins apart", () => {
    expect(new DomainError("A", "a").kind).toBe("domain");
    expect(new ApplicationError("B", "b").kind).toBe("application");
    expect(new InfrastructureError("C", "c").kind).toBe("infrastructure");
  });
});

describe("details and cause", () => {
  it("holds details when they are given", () => {
    const error = new ApplicationError("VIDEO_NOT_FOUND", "video not found", {
      details: { videoId: "abc" },
    });

    expect(error.details).toEqual({ videoId: "abc" });
  });

  it("leaves details undefined when they are not given", () => {
    expect(new ApplicationError("X", "y").details).toBeUndefined();
  });

  it("preserves the original cause", () => {
    const original = new Error("connection refused");
    const error = new InfrastructureError("BROKER_UNAVAILABLE", "broker unavailable", {
      cause: original,
    });

    expect(error.cause).toBe(original);
  });
});

describe("toJSON", () => {
  it("serializes without details when there are none", () => {
    expect(new DomainError("INVALID_STATUS", "invalid transition").toJSON()).toEqual({
      name: "DomainError",
      kind: "domain",
      code: "INVALID_STATUS",
      message: "invalid transition",
    });
  });

  it("includes details when there are some", () => {
    const error = new DomainError("INVALID_STATUS", "invalid transition", {
      details: { from: "DONE", to: "PROCESSING" },
    });

    expect(error.toJSON()).toEqual({
      name: "DomainError",
      kind: "domain",
      code: "INVALID_STATUS",
      message: "invalid transition",
      details: { from: "DONE", to: "PROCESSING" },
    });
  });
});

describe("service subclasses", () => {
  class VideoNotFoundError extends ApplicationError {
    constructor(videoId: string) {
      super("VIDEO_NOT_FOUND", "video not found", { details: { videoId } });
    }
  }

  it("inherit the origin and get their own name", () => {
    const error = new VideoNotFoundError("abc");

    expect(error.name).toBe("VideoNotFoundError");
    expect(error.kind).toBe("application");
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.details).toEqual({ videoId: "abc" });
  });
});

describe("isBaseError", () => {
  it("recognizes errors from this package", () => {
    expect(isBaseError(new DomainError("A", "a"))).toBe(true);
    expect(isBaseError(new InfrastructureError("B", "b"))).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isBaseError(new Error("plain"))).toBe(false);
    expect(isBaseError("text")).toBe(false);
    expect(isBaseError(undefined)).toBe(false);
  });
});

describe("semantic errors", () => {
  it("maps each one to the right origin", () => {
    expect(new ValidationError("INVALID_EMAIL", "invalid email").kind).toBe("domain");
    expect(new NotFoundError("VIDEO_NOT_FOUND", "video not found").kind).toBe("application");
    expect(new ConflictError("ALREADY_CONFIRMED", "upload already confirmed").kind).toBe(
      "application",
    );
    expect(new UnauthorizedError("NO_TOKEN", "missing token").kind).toBe("application");
    expect(new ForbiddenError("NOT_ALLOWED", "not allowed").kind).toBe("application");
    expect(new TimeoutError("FFMPEG_TIMEOUT", "ffmpeg timed out").kind).toBe("infrastructure");
    expect(new UnavailableError("BROKER_DOWN", "broker unavailable").kind).toBe("infrastructure");
    expect(new InternalServerError("UNEXPECTED", "unexpected failure").kind).toBe("infrastructure");
  });

  it("keeps the inheritance chain", () => {
    expect(new ValidationError("A", "a")).toBeInstanceOf(DomainError);
    expect(new NotFoundError("B", "b")).toBeInstanceOf(ApplicationError);
    expect(new TimeoutError("C", "c")).toBeInstanceOf(InfrastructureError);
    expect(new UnavailableError("D", "d")).toBeInstanceOf(BaseError);
    expect(new InternalServerError("E", "e")).toBeInstanceOf(InfrastructureError);
  });

  it("names each error after its own class", () => {
    expect(new NotFoundError("A", "a").name).toBe("NotFoundError");
    expect(new TimeoutError("B", "b").name).toBe("TimeoutError");
    expect(new InternalServerError("C", "c").name).toBe("InternalServerError");
  });
});

describe("retryable", () => {
  it("defaults to true on infrastructure errors", () => {
    expect(new InfrastructureError("A", "a").retryable).toBe(true);
    expect(new TimeoutError("B", "b").retryable).toBe(true);
    expect(new UnavailableError("C", "c").retryable).toBe(true);
    expect(new InternalServerError("D", "d").retryable).toBe(false);
  });

  it("can be turned off for a permanent failure", () => {
    const error = new InfrastructureError("CORRUPT_FILE", "file cannot be decoded", {
      retryable: false,
    });

    expect(error.retryable).toBe(false);
  });

  it("appears in the serialized form", () => {
    expect(new UnavailableError("BROKER_DOWN", "broker unavailable").toJSON()).toEqual({
      name: "UnavailableError",
      kind: "infrastructure",
      code: "BROKER_DOWN",
      message: "broker unavailable",
      retryable: true,
    });
  });

  it("keeps details alongside retryable", () => {
    const error = new TimeoutError("FFMPEG_TIMEOUT", "ffmpeg timed out", {
      details: { videoId: "abc" },
      retryable: false,
    });

    expect(error.toJSON()).toEqual({
      name: "TimeoutError",
      kind: "infrastructure",
      code: "FFMPEG_TIMEOUT",
      message: "ffmpeg timed out",
      details: { videoId: "abc" },
      retryable: false,
    });
  });
});
