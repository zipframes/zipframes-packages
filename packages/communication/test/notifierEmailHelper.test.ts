import { describe, expect, it, vi } from "vitest";

import type { Publisher } from "../src/index.js";
import { createNotifierEmailHelper } from "../src/notifier/index.js";

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const correlationId = "22222222-2222-4222-8222-222222222222";
const videoId = "11111111-1111-4111-8111-111111111111";

describe("createNotifierEmailHelper", () => {
  it("fills the envelope and publishes video.processed on zipframes.events", async () => {
    const publish = vi.fn(async () => undefined);
    const emailHelper = createNotifierEmailHelper({ publish } as Publisher);
    const payload = {
      videoId,
      resultKey: `outputs/user-1/${videoId}.zip`,
      frameCount: 10,
      durationMs: 1500,
      ownerId: "user-1",
      originalFileName: "demo.mp4",
    };

    await emailHelper.videoProcessed({ correlationId, payload });

    expect(publish).toHaveBeenCalledWith(
      {
        eventId: expect.stringMatching(uuidV4),
        eventType: "video.processed",
        version: 1,
        occurredAt: expect.stringMatching(isoInstant),
        correlationId,
        payload,
      },
      { exchange: "zipframes.events", routingKey: "video.processed" },
    );
  });

  it("publishes video.failed with the original file name", async () => {
    const publish = vi.fn(async () => undefined);
    const emailHelper = createNotifierEmailHelper({ publish } as Publisher);
    const payload = {
      videoId,
      ownerId: "user-1",
      errorCode: "INVALID_MEDIA",
      reason: "no frames extracted",
      attempts: 1,
      originalFileName: "demo.mp4",
      uploadedAt: "2026-09-22T12:00:00.000Z",
    };

    await emailHelper.videoFailed({ correlationId, payload });

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "video.failed", payload }),
      { exchange: "zipframes.events", routingKey: "video.failed" },
    );
  });
});
