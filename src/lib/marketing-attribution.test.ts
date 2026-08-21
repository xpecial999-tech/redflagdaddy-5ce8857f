import { describe, expect, it } from "vitest";
import {
  analyticsConfigured,
  analyticsMode,
  isMarketingLandingPath,
  parseMarketingAttribution,
} from "./marketing-attribution";

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
});
