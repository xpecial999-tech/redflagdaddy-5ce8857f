import { describe, expect, it, vi } from "vitest";
import { isAiAnalysisEnabled, runWhenAiAnalysisEnabled } from "./ai-analysis-config";

describe("AI analysis processing gate", () => {
  it("is disabled unless both explicit approval and a provider key are present", () => {
    expect(isAiAnalysisEnabled({})).toBe(false);
    expect(isAiAnalysisEnabled({ OPENROUTER_API_KEY: "secret" })).toBe(false);
    expect(isAiAnalysisEnabled({ AI_ANALYSIS_MODE: "enabled" })).toBe(false);
    expect(
      isAiAnalysisEnabled({
        AI_ANALYSIS_MODE: " ENABLED ",
        OPENROUTER_API_KEY: " secret ",
      }),
    ).toBe(true);
  });

  it("does not invoke sensitive processing while the gate is disabled", async () => {
    const operation = vi.fn(async () => "processed");

    await expect(
      runWhenAiAnalysisEnabled(operation, { OPENROUTER_API_KEY: "secret" }),
    ).resolves.toBeNull();
    expect(operation).not.toHaveBeenCalled();
  });

  it("invokes processing after explicit enablement", async () => {
    const operation = vi.fn(async () => "processed");

    await expect(
      runWhenAiAnalysisEnabled(operation, {
        AI_ANALYSIS_MODE: "enabled",
        OPENROUTER_API_KEY: "secret",
      }),
    ).resolves.toBe("processed");
    expect(operation).toHaveBeenCalledOnce();
  });
});
