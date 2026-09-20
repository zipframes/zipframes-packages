import { describe, expect, it } from "vitest";

import { isErr, isOk } from "@zipframes/core/result";

import { parseSchema } from "../src/parse.js";
import {
  jwksResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  userDeletedEventSchema,
  userRegisteredEventSchema,
  userUpdatedEventSchema,
} from "../src/services/auth-service/index.js";
import {
  videoFailedEventSchema,
  videoProcessedEventSchema,
  videoProcessingStartedEventSchema,
} from "../src/services/processor-worker/index.js";
import {
  confirmUploadResponseSchema,
  downloadResponseSchema,
  listVideosResponseSchema,
  requestUploadRequestSchema,
  requestUploadResponseSchema,
  videoUploadedEventSchema,
} from "../src/services/video-service/index.js";
import { EVENT_EXCHANGE } from "../src/shared/envelope.js";

const envelope = {
  eventId: "11111111-1111-4111-8111-111111111111",
  version: 1 as const,
  occurredAt: "2026-09-17T12:00:00.000Z",
  correlationId: "22222222-2222-4222-8222-222222222222",
};

const videoId = "44444444-4444-4444-8444-444444444444";
const userId = "33333333-3333-4333-8333-333333333333";

describe("EVENT_EXCHANGE", () => {
  it("names the shared integration exchange", () => {
    expect(EVENT_EXCHANGE).toBe("zipframes.events");
  });
});

describe("auth-service", () => {
  it("parses user lifecycle events", () => {
    for (const [schema, eventType, payload] of [
      [
        userRegisteredEventSchema,
        "user.registered",
        { userId, name: "Hellen", email: "hellen@example.com" },
      ],
      [
        userUpdatedEventSchema,
        "user.updated",
        { userId, name: "Hellen C.", email: "hellen@example.com" },
      ],
      [userDeletedEventSchema, "user.deleted", { userId }],
    ] as const) {
      const result = parseSchema(schema, { ...envelope, eventType, payload });
      expect(isOk(result)).toBe(true);
    }
  });

  it("parses HTTP contracts and rejects invalid input", () => {
    expect(
      isOk(
        parseSchema(registerRequestSchema, {
          name: "Hellen",
          email: "hellen@example.com",
          password: "secret123",
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(registerResponseSchema, {
          userId,
          name: "Hellen",
          email: "hellen@example.com",
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(loginRequestSchema, {
          email: "hellen@example.com",
          password: "secret123",
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(loginResponseSchema, {
          accessToken: "jwt",
          tokenType: "Bearer",
          expiresIn: 3600,
        }),
      ),
    ).toBe(true);

    expect(isOk(parseSchema(jwksResponseSchema, { keys: [{ kty: "RSA" }] }))).toBe(true);

    const invalid = parseSchema(registerRequestSchema, {
      name: "",
      email: "not-an-email",
      password: "short",
    });
    expect(isErr(invalid)).toBe(true);
    if (isErr(invalid)) {
      expect(invalid.error.code).toBe("SCHEMA_VALIDATION_FAILED");
    }
  });
});

describe("video-service and processor-worker", () => {
  it("parses the published language events", () => {
    expect(
      isOk(
        parseSchema(videoUploadedEventSchema, {
          ...envelope,
          eventType: "video.uploaded",
          payload: {
            videoId,
            ownerId: "user-1",
            sourceKey: `uploads/user-1/${videoId}`,
            originalFileName: "demo.mp4",
            sizeBytes: 1024,
          },
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(videoProcessingStartedEventSchema, {
          ...envelope,
          eventType: "video.processing.started",
          payload: { videoId, attempt: 1 },
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(videoProcessedEventSchema, {
          ...envelope,
          eventType: "video.processed",
          payload: {
            videoId,
            resultKey: `outputs/user-1/${videoId}.zip`,
            frameCount: 10,
            durationMs: 1500,
          },
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(videoFailedEventSchema, {
          ...envelope,
          eventType: "video.failed",
          payload: {
            videoId,
            ownerId: "user-1",
            errorCode: "INVALID_MEDIA",
            reason: "no frames extracted",
            attempts: 1,
          },
        }),
      ),
    ).toBe(true);
  });

  it("parses video HTTP contracts", () => {
    expect(
      isOk(
        parseSchema(requestUploadRequestSchema, {
          originalFileName: "demo.mp4",
          contentType: "video/mp4",
          sizeBytes: 2048,
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(requestUploadResponseSchema, {
          videoId,
          uploadUrl: "https://storage.example/upload",
          sourceKey: `uploads/user-1/${videoId}`,
          expiresInSeconds: 900,
        }),
      ),
    ).toBe(true);

    expect(isOk(parseSchema(confirmUploadResponseSchema, { videoId, status: "QUEUED" }))).toBe(
      true,
    );

    expect(
      isOk(
        parseSchema(listVideosResponseSchema, {
          items: [
            {
              videoId,
              originalFileName: "demo.mp4",
              status: "DONE",
              frameCount: 10,
              failureReason: null,
              expiresAt: "2026-09-18T12:00:00.000Z",
              createdAt: "2026-09-17T12:00:00.000Z",
              updatedAt: "2026-09-17T12:05:00.000Z",
            },
          ],
        }),
      ),
    ).toBe(true);

    expect(
      isOk(
        parseSchema(downloadResponseSchema, {
          videoId,
          downloadUrl: "https://storage.example/download",
          expiresInSeconds: 300,
        }),
      ),
    ).toBe(true);
  });
});
