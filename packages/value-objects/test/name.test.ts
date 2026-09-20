import { describe, expect, it } from "vitest";

import { Name } from "../src/name/index.js";

describe("valid names", () => {
  it.each([
    "Hellen",
    "Hellen Santos",
    "José da Silva",
    "Mary-Jane",
    "O'Connor",
    "Åsa",
    "João Pedro",
  ])("accepts %s", (raw) => {
    expect(Name.create(raw)).toEqual({ ok: true, value: raw });
  });

  it("trims surrounding whitespace", () => {
    expect(Name.create("  Hellen Santos  ")).toEqual({
      ok: true,
      value: "Hellen Santos",
    });
  });

  it("collapses internal whitespace", () => {
    expect(Name.create("Hellen   Santos")).toEqual({
      ok: true,
      value: "Hellen Santos",
    });
  });

  it("preserves original casing", () => {
    expect(Name.create("HeLLeN")).toEqual({ ok: true, value: "HeLLeN" });
  });

  it("accepts a name right at the length limit", () => {
    const raw = "A".repeat(100);
    expect(Name.create(raw)).toEqual({ ok: true, value: raw });
  });
});

describe("invalid names", () => {
  it("rejects an empty string", () => {
    expect(Name.create("")).toEqual({
      ok: false,
      error: { valueObject: "Name", code: "EMPTY", message: "name must not be empty" },
    });
  });

  it("rejects a string that is only whitespace", () => {
    expect(Name.create("   ")).toMatchObject({ ok: false, error: { code: "EMPTY" } });
  });

  it("rejects a name that is too short", () => {
    expect(Name.create("A")).toMatchObject({
      ok: false,
      error: { valueObject: "Name", code: "TOO_SHORT" },
    });
  });

  it("rejects a name over the length limit", () => {
    expect(Name.create("A".repeat(101))).toMatchObject({
      ok: false,
      error: { valueObject: "Name", code: "TOO_LONG" },
    });
  });

  it.each([
    "Hellen123",
    "Hellen@",
    "Hellen_Santos",
    "Hellen Santos!",
    "-Hellen",
    "Hellen-",
    "'Hellen",
    "Hellen'",
  ])("rejects %s", (raw) => {
    expect(Name.create(raw)).toMatchObject({
      ok: false,
      error: { valueObject: "Name", code: "INVALID_FORMAT" },
    });
  });
});

describe("is", () => {
  it("agrees with create", () => {
    expect(Name.is("Hellen Santos")).toBe(true);
    expect(Name.is("Hellen123")).toBe(false);
  });
});

describe("equals, toJSON and toString", () => {
  it("treats two names with the same normalized value as equal", () => {
    const a = Name.create("Hellen   Santos");
    const b = Name.create(" Hellen Santos ");
    if (!a.ok || !b.ok) throw new Error("expected both to be valid");

    expect(Name.equals(a.value, b.value)).toBe(true);
  });

  it("serializes to the normalized string", () => {
    const result = Name.create("  Hellen   Santos  ");
    if (!result.ok) throw new Error("expected a valid value");

    expect(Name.toJSON(result.value)).toBe("Hellen Santos");
    expect(Name.toString(result.value)).toBe("Hellen Santos");
    expect(JSON.stringify({ name: result.value })).toBe('{"name":"Hellen Santos"}');
  });
});
