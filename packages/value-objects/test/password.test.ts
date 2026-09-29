import { describe, expect, it } from "vitest";

import { Password, REDACTED } from "../src/password/index.js";

describe("valid passwords", () => {
  it.each(["senha123", "Zipframes2026", "aaaaaaa1", "correct horse battery 1"])(
    "accepts %s",
    (raw) => {
      expect(Password.create(raw)).toEqual({ ok: true, value: raw });
    },
  );

  it("accepts a password right at the minimum length", () => {
    expect(Password.create("abcdefg1")).toEqual({ ok: true, value: "abcdefg1" });
  });

  it("accepts a password right at the byte limit", () => {
    const raw = "a".repeat(71) + "1";
    expect(raw.length).toBe(72);
    expect(Password.create(raw)).toEqual({ ok: true, value: raw });
  });

  it("keeps the value exactly as typed, without trimming", () => {
    expect(Password.create("  senha123  ")).toEqual({ ok: true, value: "  senha123  " });
  });

  it("counts bytes, not characters, against the limit", () => {
    // Each emoji is 4 bytes in UTF-8: 17 of them plus "a1" is 70 bytes.
    const raw = "🎬".repeat(17) + "a1";
    expect(raw.length).toBeLessThan(72);
    expect(Password.create(raw)).toEqual({ ok: true, value: raw });
  });

  it("accepts a letter from any script", () => {
    expect(Password.create("сенха123")).toMatchObject({ ok: true });
  });

  it.each([
    // One case per width the UTF-8 count has to get right: 1 byte, 2, 3
    // on either side of the surrogate range, and a surrogate pair at 4.
    ["ascii, 1 byte each", "abcdefg1"],
    ["cyrillic, 2 bytes each", "сенха123"],
    ["kanji below the surrogates, 3 bytes each", "日本語動画配信中1"],
    // The digit has to be ASCII: `\d` does not match a fullwidth one.
    ["fullwidth above the surrogates, 3 bytes each", "ＡＢＣＤＥＦＧ1"],
    ["emoji, a surrogate pair of 4 bytes", "🎬🎥🍿a1"],
  ])("measures %s", (_label, raw) => {
    expect(Password.create(raw)).toMatchObject({ ok: true });
  });
});

describe("invalid passwords", () => {
  it("rejects a password under the minimum length", () => {
    expect(Password.create("senha12")).toEqual({
      ok: false,
      error: {
        valueObject: "Password",
        code: "TOO_SHORT",
        message: "password must be at least 8 characters",
      },
    });
  });

  it("rejects an empty string as too short", () => {
    expect(Password.create("")).toMatchObject({ ok: false, error: { code: "TOO_SHORT" } });
  });

  it("rejects a password over the byte limit", () => {
    const raw = "a".repeat(72) + "1";
    expect(Password.create(raw)).toMatchObject({
      ok: false,
      error: { code: "TOO_LONG", message: "password must be at most 72 bytes" },
    });
  });

  it("rejects a password that is long in bytes but short in characters", () => {
    // 19 emojis is 76 bytes, over the limit, in 38 UTF-16 code units.
    const raw = "🎬".repeat(19) + "a1";
    expect(raw.length).toBeLessThan(72);
    expect(Password.create(raw)).toMatchObject({ ok: false, error: { code: "TOO_LONG" } });
  });

  it("rejects a password with no letter", () => {
    expect(Password.create("12345678")).toMatchObject({
      ok: false,
      error: { code: "NO_LETTER", message: "password must contain at least one letter" },
    });
  });

  it("rejects a password with no digit", () => {
    expect(Password.create("senhasenha")).toMatchObject({
      ok: false,
      error: { code: "NO_DIGIT", message: "password must contain at least one digit" },
    });
  });
});

describe("is", () => {
  it("agrees with create", () => {
    expect(Password.is("senha123")).toBe(true);
    expect(Password.is("curta")).toBe(false);
  });
});

describe("equals", () => {
  it("compares two passwords by content", () => {
    const a = Password.create("senha123");
    const b = Password.create("senha123");
    const c = Password.create("outra456");
    if (!a.ok || !b.ok || !c.ok) throw new Error("expected all three to be valid");

    expect(Password.equals(a.value, b.value)).toBe(true);
    expect(Password.equals(a.value, c.value)).toBe(false);
  });
});

describe("serialization never exposes the secret", () => {
  it("redacts toJSON and toString", () => {
    const result = Password.create("senha123");
    if (!result.ok) throw new Error("expected a valid value");

    expect(Password.toJSON(result.value)).toBe(REDACTED);
    expect(Password.toString(result.value)).toBe(REDACTED);
  });

  it("does not hide the value from JSON.stringify on its own", () => {
    // The brand is only a type, so a raw stringify still sees the string:
    // the redaction works through toJSON/toString, which is what logging
    // and error payloads must go through.
    const result = Password.create("senha123");
    if (!result.ok) throw new Error("expected a valid value");

    expect(JSON.stringify({ password: Password.toJSON(result.value) })).toBe(
      '{"password":"[redacted]"}',
    );
  });
});
