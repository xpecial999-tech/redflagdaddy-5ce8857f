import { describe, expect, it } from "vitest";
import { normalizePublicSiteOrigin, publicInviteUrl } from "./site-url.server";

describe("public site origin", () => {
  it("uses one canonical configuration with a temporary legacy fallback", () => {
    expect(
      normalizePublicSiteOrigin("https://staging.redflagdaddy.com", "https://old.example"),
    ).toBe("https://staging.redflagdaddy.com");
    expect(normalizePublicSiteOrigin(undefined, "https://legacy.redflagdaddy.com")).toBe(
      "https://legacy.redflagdaddy.com",
    );
    expect(() => normalizePublicSiteOrigin(undefined)).toThrow(
      "Public site URL is not configured.",
    );
  });

  it("rejects unsafe protocols, credentials and path-bearing configuration", () => {
    for (const value of [
      "http://example.com",
      "javascript:alert(1)",
      "https://user:pass@example.com",
      "https://example.com/private",
      "https://example.com/?token=secret",
    ]) {
      expect(() => normalizePublicSiteOrigin(value), value).toThrow();
    }
    expect(normalizePublicSiteOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("rebuilds invitation links from the current environment origin", () => {
    const previous = process.env.PUBLIC_SITE_URL;
    process.env.PUBLIC_SITE_URL = "https://staging.redflagdaddy.com";
    try {
      expect(publicInviteUrl("ABC 123")).toBe("https://staging.redflagdaddy.com/j/ABC%20123");
    } finally {
      if (previous === undefined) delete process.env.PUBLIC_SITE_URL;
      else process.env.PUBLIC_SITE_URL = previous;
    }
  });
});
