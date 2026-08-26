import { describe, expect, it } from "vitest";
import {
  formatOwnerCode,
  generateOwnerCode,
  hashOwnerCode,
  isValidOwnerCode,
  normalizeOwnerCode,
} from "./anonymous-owner-code.server";

describe("anonymous owner codes", () => {
  it("generates a readable 120-bit code without ambiguous characters", () => {
    const code = generateOwnerCode();
    expect(code).toMatch(
      /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}(?:-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}){3}$/,
    );
    expect(isValidOwnerCode(code)).toBe(true);
  });

  it("normalizes harmless separators and casing", () => {
    const raw = "234567-89abcd-efghjk-mnpqrs";
    expect(normalizeOwnerCode(raw)).toBe("23456789ABCDEFGHJKMNPQRS");
    expect(formatOwnerCode(raw)).toBe("234567-89ABCD-EFGHJK-MNPQRS");
    expect(isValidOwnerCode(raw)).toBe(true);
  });

  it("hashes equivalent representations identically without retaining the code", async () => {
    const code = "234567-89ABCD-EFGHJK-MNPQRS";
    const hash = await hashOwnerCode(code);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(await hashOwnerCode("23456789abcdefghjkmnpqrs"));
    expect(hash).not.toContain("234567");
  });

  it("rejects short and ambiguous codes", () => {
    expect(isValidOwnerCode("TOO-SHORT")).toBe(false);
    expect(isValidOwnerCode("OOOOOO-111111-IIIIII-LLLLLL")).toBe(false);
  });
});
