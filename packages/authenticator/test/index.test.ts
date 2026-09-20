import { describe, expect, it } from "vitest";

import * as authenticator from "../src/index.js";

describe("public package surface", () => {
  it("exports the jwks and verify helpers", () => {
    expect(Object.keys(authenticator)).toEqual(
      expect.arrayContaining([
        "createJwksClient",
        "createAuthenticator",
        "createAuthenticatorFromKey",
      ]),
    );
  });
});
