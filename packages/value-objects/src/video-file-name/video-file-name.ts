import { err, ok } from "@zipframes/core/result";
import type { Brand } from "@zipframes/core";

import { defineValueObject } from "../base/index.js";

/**
 * Extensions the platform accepts for an upload. The list is part of the
 * contract: it is what the client offers in the file picker and what the
 * worker can hand to ffmpeg.
 */
export const ACCEPTED_VIDEO_EXTENSIONS = [
  "mp4",
  "avi",
  "mov",
  "mkv",
  "wmv",
  "flv",
  "webm",
] as const;

const MAX_LENGTH = 255;

// A name, not a path: separators and control characters would end up in
// object storage metadata and in the Content-Disposition of the download.
// `\p{Cc}` rather than a literal range, so the pattern carries no control
// character of its own.
const FORBIDDEN = /[/\\]|\p{Cc}/u;

const extensionOf = (name: string): string | undefined =>
  /\.([^.]+)$/u.exec(name)?.[1]?.toLowerCase();

/**
 * The name the owner gave a video file, with an extension the platform
 * accepts.
 *
 * Deliberately not called `FileName`: a value object of that name in a
 * shared package would be a trap, since this one rejects every extension
 * that is not video.
 */
export const VideoFileName = defineValueObject({
  name: "VideoFileName",
  parse: (raw: string) => {
    const name = raw.trim();

    if (name.length === 0 || name.length > MAX_LENGTH || FORBIDDEN.test(name)) {
      return err({
        code: "INVALID_FILE_NAME",
        message: `file name must have 1 to ${String(MAX_LENGTH)} characters and no path separators`,
      });
    }

    const extension = extensionOf(name);
    if (
      extension === undefined ||
      !(ACCEPTED_VIDEO_EXTENSIONS as readonly string[]).includes(extension)
    ) {
      return err({
        code: "UNSUPPORTED_EXTENSION",
        message: `file extension must be one of: ${ACCEPTED_VIDEO_EXTENSIONS.join(", ")}`,
      });
    }

    return ok(name);
  },
});

export type VideoFileName = Brand<string, "VideoFileName">;

/**
 * Rehydrates a name that was already validated before it was stored.
 *
 * Reading a row back is not a place to re-run the policy: a name that was
 * accepted under an older extension list must still load. Use it only for
 * values that came out of storage, never for input.
 */
export const asVideoFileName = (name: string): VideoFileName => name as VideoFileName;
