import { describe, expect, it } from "vitest";
import {
  analyticsConfigured,
  analyticsMode,
  isMarketingLandingPath,
  MARKETING_SOURCES,
  parseMarketingAttribution,
} from "./marketing-attribution";
import { readFileSync } from "node:fs";

describe("marketing attribution", () => {
  it("accepts the canonical organic-social UTM format", () => {
    expect(
      parseMarketingAttribution(
        "?utm_source=Instagram&utm_medium=organic_social&utm_campaign=2026-09-awareness&utm_content=greenflags-reel-boundaries-v1",
      ),
    ).toEqual({
      source: "instagram",
      medium: "organic_social",
      campaign: "2026-09-awareness",
      content: "greenflags-reel-boundaries-v1",
    });
  });

  it.each(["fetlife", "reddit", "x"])(
    "accepts the approved community launch source %s",
    (source) => {
      expect(
        parseMarketingAttribution(
          `?utm_source=${source}&utm_medium=organic_social&utm_campaign=community_launch`,
        ),
      ).toEqual({
        source,
        medium: "organic_social",
        campaign: "community_launch",
        content: null,
      });
    },
  );

  it("uses the same approved source list at the browser and server boundaries", () => {
    expect(MARKETING_SOURCES).toEqual([
      "fetlife",
      "reddit",
      "x",
      "tiktok",
      "instagram",
      "threads",
      "youtube",
    ]);
    const serverSource = readFileSync(
      new URL("./marketing-analytics.functions.ts", import.meta.url),
      "utf8",
    );
    expect(serverSource).toContain("z.enum(MARKETING_SOURCES)");

    const migration = readFileSync(
      new URL(
        "../../supabase/migrations/20260829000000_expand_marketing_sources.sql",
        import.meta.url,
      ),
      "utf8",
    );
    for (const source of MARKETING_SOURCES) {
      expect(migration).toContain(`'${source}'`);
    }
  });

  it("rejects unknown sources and media", () => {
    expect(parseMarketingAttribution("?utm_source=facebook&utm_medium=organic_social")).toBeNull();
    expect(parseMarketingAttribution("?utm_source=tiktok&utm_medium=paid_social")).toBeNull();
  });

  it("omits unsafe free-text campaign values", () => {
    expect(
      parseMarketingAttribution(
        "?utm_source=threads&utm_medium=organic_social&utm_campaign=private%20story&utm_content=education-post-v1",
      ),
    ).toEqual({
      source: "threads",
      medium: "organic_social",
      campaign: null,
      content: "education-post-v1",
    });
  });

  it("limits the consent prompt to public marketing pages", () => {
    expect(isMarketingLandingPath("/")).toBe(true);
    expect(isMarketingLandingPath("/register")).toBe(true);
    expect(isMarketingLandingPath("/assessment/private-code")).toBe(false);
    expect(isMarketingLandingPath("/report/private-token")).toBe(false);
  });

  it("is disabled by default and recognizes explicit environments", () => {
    expect(analyticsConfigured(undefined)).toBe(false);
    expect(analyticsMode("preview")).toBeNull();
    expect(analyticsMode("staging")).toBe("staging");
    expect(analyticsMode("production")).toBe("production");
  });

  it("uses the server build environment as the analytics authority", () => {
    const serverSource = readFileSync(
      new URL("./marketing-analytics.functions.ts", import.meta.url),
      "utf8",
    );
    expect(serverSource).toContain("const serverEnvironment = analyticsMode()");
    expect(serverSource).toContain("data.environment !== serverEnvironment");
    expect(serverSource).toContain("environment: serverEnvironment");
    expect(serverSource).not.toContain("environment: data.environment");
  });
});
