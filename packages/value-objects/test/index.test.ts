import { describe, expect, expectTypeOf, it } from "vitest";

import * as valueObjects from "../src/index.js";
import { Email } from "../src/index.js";
import type { Email as EmailType } from "../src/index.js";

describe("public package surface", () => {
  it("exports the base factory and all generic value objects as values", () => {
    expect(Object.keys(valueObjects)).toEqual(
      expect.arrayContaining(["defineValueObject", "Email", "Phone", "Cpf", "Cnpj", "Name"]),
    );
  });

  it("re-exports the same Email implementation as the email module", () => {
    expect(valueObjects.Email).toBe(Email);
  });

  it("also re-exports Email as a usable type, not just a value", () => {
    const result = Email.create("hellen@example.com");
    if (!result.ok) throw new Error("expected a valid value");

    const typed: EmailType = result.value;
    expectTypeOf(typed).toEqualTypeOf<EmailType>();
    expect(typed).toBe("hellen@example.com");
  });
});
