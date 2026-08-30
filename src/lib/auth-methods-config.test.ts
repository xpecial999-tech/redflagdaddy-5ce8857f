import { describe, expect, it } from "vitest";
import { getAuthMethodsConfig, hasAlternativeSignIn } from "./auth-methods-config";

describe("authentication method configuration", () => {
  it("keeps every alternative disabled unless explicitly enabled", () => {
    const config = getAuthMethodsConfig({});
    expect(config).toEqual({
      emailSignIn: false,
      googleSignIn: false,
      appleSignIn: false,
      accountLinking: false,
    });
    expect(hasAlternativeSignIn(config)).toBe(false);
  });

  it("accepts only the explicit enabled value", () => {
    expect(
      getAuthMethodsConfig({
        VITE_AUTH_EMAIL_MODE: "enabled",
        VITE_AUTH_GOOGLE_MODE: "ENABLED",
        VITE_AUTH_APPLE_MODE: "true",
        VITE_AUTH_ACCOUNT_LINKING_MODE: "1",
      }),
    ).toEqual({
      emailSignIn: true,
      googleSignIn: true,
      appleSignIn: false,
      accountLinking: false,
    });
  });
});
