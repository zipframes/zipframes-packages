import { err, ok } from "@zipframes/core/result";
import type { Brand } from "@zipframes/core";

import { defineValueObject } from "../base/index.js";

// Person / display names: letters (including accents), spaces, hyphens and
// apostrophes. Digits and other punctuation are rejected. Whitespace is
// collapsed so "Hellen   Santos" and "Hellen Santos" compare equal.
const NAME_PATTERN = /^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u;
const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

export const Name = defineValueObject({
  name: "Name",
  parse: (raw: string) => {
    const normalized = raw.trim().replace(/\s+/g, " ");

    if (normalized.length === 0) {
      return err({ code: "EMPTY", message: "name must not be empty" });
    }
    if (normalized.length < MIN_LENGTH) {
      return err({
        code: "TOO_SHORT",
        message: `name must be at least ${String(MIN_LENGTH)} characters`,
      });
    }
    if (normalized.length > MAX_LENGTH) {
      return err({
        code: "TOO_LONG",
        message: `name must be at most ${String(MAX_LENGTH)} characters`,
      });
    }
    if (!NAME_PATTERN.test(normalized)) {
      return err({ code: "INVALID_FORMAT", message: "invalid name format" });
    }

    return ok(normalized);
  },
});

export type Name = Brand<string, "Name">;
