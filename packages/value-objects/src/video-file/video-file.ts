import { err, ok } from "@zipframes/core/result";
import type { Brand } from "@zipframes/core";

import { defineValueObject } from "../base/index.js";
import { VideoFileName } from "../video-file-name/index.js";

/** What the owner declared about a file: its name and its MIME type. */
export interface VideoFileValue {
  readonly name: VideoFileName;
  readonly contentType: string;
}

/** The raw pair `create` accepts, before either half is validated. */
export interface RawVideoFile {
  readonly name: string;
  readonly contentType: string;
}

const CONTENT_TYPE_MAX_LENGTH = 100;
const MIME_TYPE = /^[\w.+-]+\/[\w.+-]+$/u;

/**
 * A video file as declared by its owner, validated before a single byte is
 * received, so a wrong file is refused up front.
 *
 * The only composite value object in this package: `TValue` is an object,
 * so it defines its own `equals` and `serialize` rather than relying on the
 * `===` and identity defaults.
 */
export const VideoFile = defineValueObject<"VideoFile", RawVideoFile, VideoFileValue>({
  name: "VideoFile",
  parse: (raw) => {
    const name = VideoFileName.create(raw.name);
    if (!name.ok) {
      // The name's own code and message are kept, since they are what says
      // what is wrong. Only `valueObject` changes, to "VideoFile".
      return err({ code: name.error.code, message: name.error.message });
    }

    const contentType = raw.contentType.trim();
    if (contentType.length > CONTENT_TYPE_MAX_LENGTH || !MIME_TYPE.test(contentType)) {
      return err({ code: "INVALID_CONTENT_TYPE", message: "content type must be a MIME type" });
    }

    return ok({ name: name.value, contentType });
  },
  equals: (a, b) => a.name === b.name && a.contentType === b.contentType,
  serialize: (value) => ({ name: value.name, contentType: value.contentType }),
});

export type VideoFile = Brand<VideoFileValue, "VideoFile">;
