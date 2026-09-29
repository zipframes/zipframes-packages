import { describe, expect, it } from "vitest";

import {
  ACCEPTED_VIDEO_EXTENSIONS,
  VideoFileName,
  asVideoFileName,
} from "../src/video-file-name/index.js";

describe("valid video file names", () => {
  it.each(ACCEPTED_VIDEO_EXTENSIONS)("accepts the .%s extension", (extension) => {
    expect(VideoFileName.create(`apresentacao.${extension}`)).toEqual({
      ok: true,
      value: `apresentacao.${extension}`,
    });
  });

  it("accepts the extension in any case", () => {
    expect(VideoFileName.create("APRESENTACAO.MP4")).toEqual({
      ok: true,
      value: "APRESENTACAO.MP4",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(VideoFileName.create("  aula.mp4  ")).toEqual({ ok: true, value: "aula.mp4" });
  });

  it("takes the last extension when the name has several dots", () => {
    expect(VideoFileName.create("aula.final.v2.mp4")).toMatchObject({ ok: true });
  });

  it("accepts a name right at the length limit", () => {
    const raw = "a".repeat(251) + ".mp4";
    expect(raw.length).toBe(255);
    expect(VideoFileName.create(raw)).toEqual({ ok: true, value: raw });
  });
});

describe("invalid video file names", () => {
  it("rejects an empty string", () => {
    expect(VideoFileName.create("")).toEqual({
      ok: false,
      error: {
        valueObject: "VideoFileName",
        code: "INVALID_FILE_NAME",
        message: "file name must have 1 to 255 characters and no path separators",
      },
    });
  });

  it("rejects a string that is only whitespace", () => {
    expect(VideoFileName.create("   ")).toMatchObject({
      ok: false,
      error: { code: "INVALID_FILE_NAME" },
    });
  });

  it("rejects a name over the length limit", () => {
    const raw = "a".repeat(252) + ".mp4";
    expect(raw.length).toBe(256);
    expect(VideoFileName.create(raw)).toMatchObject({
      ok: false,
      error: { code: "INVALID_FILE_NAME" },
    });
  });

  it.each([
    "pasta/aula.mp4",
    "pasta\\aula.mp4",
    "../aula.mp4",
    "aula\u0000.mp4",
    "aula\n.mp4",
    "aula\u007f.mp4",
  ])("rejects %j, which is a path or carries a control character", (raw) => {
    expect(VideoFileName.create(raw)).toMatchObject({
      ok: false,
      error: { code: "INVALID_FILE_NAME" },
    });
  });

  it("rejects a name with no extension", () => {
    expect(VideoFileName.create("aula")).toEqual({
      ok: false,
      error: {
        valueObject: "VideoFileName",
        code: "UNSUPPORTED_EXTENSION",
        message: "file extension must be one of: mp4, avi, mov, mkv, wmv, flv, webm",
      },
    });
  });

  it.each(["documento.pdf", "planilha.xlsx", "audio.mp3", "imagem.png", "arquivo.mp4x"])(
    "rejects %s, whose extension is not video",
    (raw) => {
      expect(VideoFileName.create(raw)).toMatchObject({
        ok: false,
        error: { code: "UNSUPPORTED_EXTENSION" },
      });
    },
  );

  it("rejects a name that ends in a dot", () => {
    expect(VideoFileName.create("aula.")).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_EXTENSION" },
    });
  });
});

describe("is, equals, toJSON and toString", () => {
  it("agrees with create", () => {
    expect(VideoFileName.is("aula.mp4")).toBe(true);
    expect(VideoFileName.is("aula.pdf")).toBe(false);
  });

  it("compares by content", () => {
    const a = VideoFileName.create("aula.mp4");
    const b = VideoFileName.create("  aula.mp4  ");
    const c = VideoFileName.create("outra.mp4");
    if (!a.ok || !b.ok || !c.ok) throw new Error("expected all three to be valid");

    expect(VideoFileName.equals(a.value, b.value)).toBe(true);
    expect(VideoFileName.equals(a.value, c.value)).toBe(false);
  });

  it("serializes to the trimmed string", () => {
    const result = VideoFileName.create("  aula.mp4  ");
    if (!result.ok) throw new Error("expected a valid value");

    expect(VideoFileName.toJSON(result.value)).toBe("aula.mp4");
    expect(VideoFileName.toString(result.value)).toBe("aula.mp4");
  });
});

describe("asVideoFileName", () => {
  it("rehydrates a stored name without re-running the policy", () => {
    // A name accepted under an older extension list must still load.
    expect(asVideoFileName("legado.3gp")).toBe("legado.3gp");
  });
});
