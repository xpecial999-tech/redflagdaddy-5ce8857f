import { describe, expect, it } from "vitest";
import { redactPrivatePathname } from "./lovable-error-reporting";

describe("redactPrivatePathname", () => {
  it.each([
    ["/j/SECRET123", "/j/[redacted]"],
    ["/journey/SECRET123", "/journey/[redacted]"],
    ["/assessment/SECRET123", "/assessment/[redacted]"],
    ["/report/0123456789abcdef", "/report/[redacted]"],
    ["/results/550e8400-e29b-41d4-a716-446655440000", "/results/[redacted]"],
    ["/journeys/550e8400-e29b-41d4-a716-446655440000", "/journeys/[redacted]"],
  ])("redacts %s", (pathname, expected) => {
    expect(redactPrivatePathname(pathname)).toBe(expected);
  });

  it("preserves public route names", () => {
    expect(redactPrivatePathname("/about")).toBe("/about");
  });
});
