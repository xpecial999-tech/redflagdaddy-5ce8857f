import { describe, expect, it } from "vitest";
import { SupportRequestSchema } from "./support";

const validRequest = {
  replyEmail: "Person@Example.com",
  category: "product_account",
  concerns: "own_account",
  journeyReference: null,
  message: "I need help accessing my own account, please.",
  turnstileToken: "verified-widget-token",
  notEmergency: true,
  website: "",
};

describe("support request validation", () => {
  it("normalizes a minimal valid request", () => {
    const result = SupportRequestSchema.parse(validRequest);
    expect(result.replyEmail).toBe("person@example.com");
    expect(result.message).toBe(validRequest.message);
  });

  it("accepts a journey UUID but rejects private URLs and access codes", () => {
    expect(
      SupportRequestSchema.parse({
        ...validRequest,
        journeyReference: "3d594650-3436-4e2f-b694-c9dfcb590a2e",
      }).journeyReference,
    ).toBe("3d594650-3436-4e2f-b694-c9dfcb590a2e");
    expect(() =>
      SupportRequestSchema.parse({
        ...validRequest,
        journeyReference: "https://redflagdaddy.com/j/private-access-token",
      }),
    ).toThrow("Enter a journey ID, not a private link or access code.");
  });

  it("rejects emergency acknowledgement, spam fields and oversized content", () => {
    expect(() => SupportRequestSchema.parse({ ...validRequest, notEmergency: false })).toThrow();
    expect(() =>
      SupportRequestSchema.parse({ ...validRequest, website: "spam.example" }),
    ).toThrow();
    expect(() => SupportRequestSchema.parse({ ...validRequest, message: "Too short" })).toThrow();
    expect(() =>
      SupportRequestSchema.parse({ ...validRequest, journeyReference: "access-code" }),
    ).toThrow();
  });

  it("accepts only the approved intake categories", () => {
    expect(() => SupportRequestSchema.parse({ ...validRequest, category: "emergency" })).toThrow();
    expect(() =>
      SupportRequestSchema.parse({ ...validRequest, concerns: "partner_phone" }),
    ).toThrow();
  });
});
