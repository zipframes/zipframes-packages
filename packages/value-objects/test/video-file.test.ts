import { describe, expect, it } from "vitest";

import { VideoFile } from "../src/video-file/index.js";

const valid = { name: "aula.mp4", contentType: "video/mp4" };

describe("valid video files", () => {
  it("accepts a name and a MIME type", () => {
    expect(VideoFile.create(valid)).toEqual({
      ok: true,
      value: { name: "aula.mp4", contentType: "video/mp4" },
    });
  });

  it("trims both halves", () => {
    expect(VideoFile.create({ name: "  aula.mp4  ", contentType: "  video/mp4  " })).toEqual({
      ok: true,
      value: { name: "aula.mp4", contentType: "video/mp4" },
    });
  });

  it.each(["video/mp4", "video/x-matroska", "application/octet-stream", "video/vnd.dlna.mpeg-tts"])(
    "accepts the MIME type %s",
    (contentType) => {
      expect(VideoFile.create({ ...valid, contentType })).toMatchObject({ ok: true });
    },
  );

  it("accepts a content type right at the length limit", () => {
    const contentType = "video/" + "a".repeat(94);
    expect(contentType.length).toBe(100);
    expect(VideoFile.create({ ...valid, contentType })).toMatchObject({ ok: true });
  });
});

describe("invalid video files", () => {
  it("propagates the name's error code and message", () => {
    expect(VideoFile.create({ name: "documento.pdf", contentType: "video/mp4" })).toEqual({
      ok: false,
      error: {
        // The code says what is wrong; only the value object's name changes.
        valueObject: "VideoFile",
        code: "UNSUPPORTED_EXTENSION",
        message: "file extension must be one of: mp4, avi, mov, mkv, wmv, flv, webm",
      },
    });
  });

  it("propagates an invalid name as well", () => {
    expect(VideoFile.create({ name: "pasta/aula.mp4", contentType: "video/mp4" })).toMatchObject({
      ok: false,
      error: { valueObject: "VideoFile", code: "INVALID_FILE_NAME" },
    });
  });

  it("rejects a content type over the length limit", () => {
    const contentType = "video/" + "a".repeat(95);
    expect(contentType.length).toBe(101);
    expect(VideoFile.create({ ...valid, contentType })).toMatchObject({
      ok: false,
      error: { code: "INVALID_CONTENT_TYPE", message: "content type must be a MIME type" },
    });
  });

  it.each(["", "video", "video/", "/mp4", "video mp4", "video/mp4; charset=utf-8", "video//mp4"])(
    "rejects %j, which is not a MIME type",
    (contentType) => {
      expect(VideoFile.create({ ...valid, contentType })).toMatchObject({
        ok: false,
        error: { valueObject: "VideoFile", code: "INVALID_CONTENT_TYPE" },
      });
    },
  );

  it("checks the name before the content type", () => {
    expect(
      VideoFile.create({ name: "documento.pdf", contentType: "not a mime type" }),
    ).toMatchObject({ ok: false, error: { code: "UNSUPPORTED_EXTENSION" } });
  });
});

describe("is", () => {
  it("agrees with create", () => {
    expect(VideoFile.is(valid)).toBe(true);
    expect(VideoFile.is({ name: "documento.pdf", contentType: "video/mp4" })).toBe(false);
  });
});

describe("equals, on a composite value", () => {
  const create = (name: string, contentType: string) => {
    const result = VideoFile.create({ name, contentType });
    if (!result.ok) throw new Error(`expected ${name} / ${contentType} to be valid`);
    return result.value;
  };

  it("treats two files with the same content as equal, across references", () => {
    expect(create("aula.mp4", "video/mp4")).not.toBe(create("aula.mp4", "video/mp4"));
    expect(VideoFile.equals(create("aula.mp4", "video/mp4"), create("aula.mp4", "video/mp4"))).toBe(
      true,
    );
  });

  it("separates two files whose names differ", () => {
    expect(
      VideoFile.equals(create("aula.mp4", "video/mp4"), create("outra.mp4", "video/mp4")),
    ).toBe(false);
  });

  it("separates two files whose content types differ", () => {
    expect(
      VideoFile.equals(create("aula.mp4", "video/mp4"), create("aula.mp4", "video/x-matroska")),
    ).toBe(false);
  });
});

describe("toJSON and toString", () => {
  it("serializes to the pair, and prints it as JSON", () => {
    const result = VideoFile.create(valid);
    if (!result.ok) throw new Error("expected a valid value");

    expect(VideoFile.toJSON(result.value)).toEqual({ name: "aula.mp4", contentType: "video/mp4" });
    // The default toString stringifies whatever serialize returned, since
    // this value object does not serialize to a string.
    expect(VideoFile.toString(result.value)).toBe('{"name":"aula.mp4","contentType":"video/mp4"}');
  });
});
