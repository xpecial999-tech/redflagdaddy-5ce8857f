import { describe, expect, it } from "vitest";
import {
  parseSmsStatusUpdates,
  readBoundedSmsStatusBody,
  verifySmsStatusAuthorization,
} from "./sms-status-callback";

describe("SMS status callback boundary", () => {
  it("fails closed until callback credentials are configured", () => {
    expect(verifySmsStatusAuthorization(null, undefined, undefined)).toBe("unconfigured");
    expect(verifySmsStatusAuthorization(null, "callback", "secret")).toBe("unauthorized");
    expect(
      verifySmsStatusAuthorization(`Basic ${btoa("callback:secret")}`, "callback", "secret"),
    ).toBe("authorized");
    expect(
      verifySmsStatusAuthorization(`Basic ${btoa("callback:wrong")}`, "callback", "secret"),
    ).toBe("unauthorized");
  });

  it("rejects oversized callback bodies before parsing", async () => {
    const request = new Request("https://redflagdaddy.com/api/public/sms/status", {
      method: "POST",
      body: "12345",
    });
    await expect(readBoundedSmsStatusBody(request, 4)).rejects.toMatchObject({ status: 413 });
  });

  it("normalizes bounded provider updates and ignores malformed events", () => {
    const updates = parseSmsStatusUpdates(
      JSON.stringify({
        messages: [
          { messageId: "message-1", statusDescription: "DELIVERED" },
          null,
          { status: "missing id" },
          {
            apiMessageId: "message-2",
            status: "FAILED",
            errorDescription: "x".repeat(600),
          },
        ],
      }),
    );

    expect(updates).toEqual([
      { id: "message-1", status: "DELIVERED", error: null },
      { id: "message-2", status: "FAILED", error: "x".repeat(500) },
    ]);
  });

  it("rejects invalid JSON without returning or logging its contents", () => {
    expect(() => parseSmsStatusUpdates("private malformed payload")).toThrow("bad payload");
  });
});
