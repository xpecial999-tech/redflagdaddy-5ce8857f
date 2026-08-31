import { describe, expect, it } from "vitest";
import { buildInviteSms } from "./invite-message";

const URL = "https://staging.redflagdaddy.com/j/ABC123";

describe("journey invitation SMS", () => {
  it("always preserves the complete private link when personalization is long", () => {
    const message = buildInviteSms({
      recipientName: "R".repeat(120),
      senderName: "S".repeat(120),
      notes: "N".repeat(2_000),
      url: URL,
    });

    expect(message.length).toBeLessThanOrEqual(440);
    expect(message.endsWith(`Jump in here: ${URL}`)).toBe(true);
    expect(message).toContain("...");
  });

  it("drops optional notes before risking the required link", () => {
    const message = buildInviteSms({
      recipientName: "Partner",
      senderName: "Account holder",
      notes: "Short note",
      url: `https://example.test/j/${"x".repeat(260)}`,
    });

    expect(message.length).toBeLessThanOrEqual(440);
    expect(message).toContain("Jump in here: https://example.test/j/");
  });

  it("fails instead of sending a truncated or missing link", () => {
    expect(() => buildInviteSms({ url: `https://example.test/${"x".repeat(400)}` })).toThrow(
      "The invitation link could not be included in the SMS.",
    );
  });
});
