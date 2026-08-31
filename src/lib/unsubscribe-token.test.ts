import { describe, expect, it } from "vitest";
import { normalizeUnsubscribeToken } from "./unsubscribe-token";

describe("unsubscribe bearer tokens", () => {
  it("accepts generated 32-byte hexadecimal tokens", () => {
    expect(normalizeUnsubscribeToken("A".repeat(64))).toBe("a".repeat(64));
  });

  it("rejects missing, malformed and oversized values", () => {
    for (const value of [null, undefined, {}, "short", "g".repeat(64), "a".repeat(65)]) {
      expect(normalizeUnsubscribeToken(value)).toBeNull();
    }
  });
});
