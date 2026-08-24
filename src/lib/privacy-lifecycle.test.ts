import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  DELETE_FAILURE_MESSAGE,
  INVITE_EXPORT_FIELDS,
  PAYMENT_EXPORT_FIELDS,
  requirePrivacyResult,
  RESULT_EXPORT_FIELDS,
  smsLogPhone,
} from "./privacy-lifecycle";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("privacy lifecycle", () => {
  it("returns successful query data", () => {
    expect(
      requirePrivacyResult(
        { data: [{ id: "record-1" }], error: null },
        "load records",
        DELETE_FAILURE_MESSAGE,
      ),
    ).toEqual([{ id: "record-1" }]);
  });

  it("logs the internal failure but returns only a safe public error", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      requirePrivacyResult(
        { data: null, error: { message: "private database detail" } },
        "delete records",
        DELETE_FAILURE_MESSAGE,
      ),
    ).toThrow(DELETE_FAILURE_MESSAGE);
    expect(log).toHaveBeenCalledWith(
      "[data-privacy] delete records failed:",
      "private database detail",
    );
    log.mockRestore();
  });

  it("normalizes the SMS delivery-log phone format", () => {
    expect(smsLogPhone("+27 82 123 4567")).toBe("27821234567");
  });

  it("exports useful records without bearer tokens or raw provider payloads", () => {
    expect(INVITE_EXPORT_FIELDS).not.toContain("code");
    expect(RESULT_EXPORT_FIELDS).not.toContain("share_token");
    expect(PAYMENT_EXPORT_FIELDS).not.toContain("raw");

    const privacySource = source("src/lib/data-privacy.functions.ts");
    expect(privacySource).toContain('.from("payments")');
    expect(privacySource).not.toContain('.select("*")');
  });
});
