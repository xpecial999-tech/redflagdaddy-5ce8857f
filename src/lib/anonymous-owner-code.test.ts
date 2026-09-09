import { describe, expect, it } from "vitest";
import {
  formatOwnerCode,
  generateOwnerCode,
  hashOwnerCode,
  isValidOwnerCode,
  normalizeOwnerCode,
} from "./anonymous-owner-code.server";

describe("anonymous owner codes", () => {
  it("generates a readable 80-bit code without ambiguous characters", () => {
    const code = generateOwnerCode();
    expect(code).toMatch(
      /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/,
    );
    expect(isValidOwnerCode(code)).toBe(true);
  });

  it("normalizes harmless separators and casing", () => {
    const raw = "23456789-abcdEFGH";
    expect(normalizeOwnerCode(raw)).toBe("23456789ABCDEFGH");
    expect(formatOwnerCode(raw)).toBe("23456789-ABCDEFGH");
    expect(isValidOwnerCode(raw)).toBe(true);
  });

  it("hashes equivalent representations identically without retaining the code", async () => {
    const code = "23456789-ABCDEFGH";
    const hash = await hashOwnerCode(code);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(await hashOwnerCode("23456789abcdefgh"));
    expect(hash).not.toContain("234567");
  });

  it("rejects short and ambiguous codes", () => {
    expect(isValidOwnerCode("TOO-SHORT")).toBe(false);
    expect(isValidOwnerCode("OOOOOO-111111-IIIIII-LLLLLL")).toBe(false);
  });
});
