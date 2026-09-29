import { err, ok } from "@zipframes/core/result";
import type { Brand } from "@zipframes/core";

import { defineValueObject } from "../base/index.js";

const MIN_LENGTH = 8;

// bcrypt silently truncates anything past 72 bytes, so accepting longer
// passwords would mean telling people characters count when they do not.
// It is a hashing limit rather than a policy choice, which is why it sits
// alongside the rules instead of being configurable.
const MAX_BYTES = 72;

/**
 * UTF-8 byte length, counted from the code points.
 *
 * Neither `Buffer` nor `TextEncoder` is in scope here: this package
 * compiles against `lib: ["ES2022"]` alone, with no Node and no DOM, so
 * that it runs wherever the services do. `for...of` walks code points, so
 * a surrogate pair is counted once, as the 4 bytes it really is.
 */
const byteLength = (raw: string): number => {
  let bytes = 0;
  for (let index = 0; index < raw.length; index += 1) {
    const unit = raw.charCodeAt(index);
    if (unit < 0x80) {
      bytes += 1;
    } else if (unit < 0x800) {
      bytes += 2;
    } else if (unit < 0xd800 || unit > 0xdbff) {
      bytes += 3;
    } else {
      // A high surrogate: it and the unit after it are one code point,
      // four bytes in UTF-8, so the pair is counted once.
      bytes += 4;
      index += 1;
    }
  }
  return bytes;
};

/**
 * What `toJSON` and `toString` return instead of the secret.
 *
 * The other value objects here serialize to their value. This one must
 * not: a password reaches logs and error payloads through exactly those
 * two functions, and the plaintext is never meant to leave memory. Only
 * the bcrypt hash is ever stored, and that is the service's business.
 */
export const REDACTED = "[redacted]";

/**
 * A plaintext password that satisfies the platform's policy.
 *
 * Unlike an email or a CPF, "a valid password" is not a universal shape —
 * it is a rule this platform chose. It lives here so there is one answer
 * across the services; changing it means publishing this package.
 */
export const Password = defineValueObject({
  name: "Password",
  parse: (raw: string) => {
    if (raw.length < MIN_LENGTH) {
      return err({
        code: "TOO_SHORT",
        message: `password must be at least ${String(MIN_LENGTH)} characters`,
      });
    }
    if (byteLength(raw) > MAX_BYTES) {
      return err({
        code: "TOO_LONG",
        message: `password must be at most ${String(MAX_BYTES)} bytes`,
      });
    }
    if (!/\p{L}/u.test(raw)) {
      return err({ code: "NO_LETTER", message: "password must contain at least one letter" });
    }
    if (!/\d/u.test(raw)) {
      return err({ code: "NO_DIGIT", message: "password must contain at least one digit" });
    }

    // Never trimmed and never normalized: a password is used exactly as
    // typed, and stripping a leading space would silently accept a
    // different secret than the one chosen.
    return ok(raw);
  },
  serialize: () => REDACTED,
});

export type Password = Brand<string, "Password">;
