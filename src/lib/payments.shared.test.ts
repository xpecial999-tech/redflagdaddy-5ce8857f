import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatCheckoutPrice,
  isPeachSuccessCode,
  peachPaymentStatus,
  verifyPeachWebhookSignature,
} from "./payments.shared";

describe("payment helpers", () => {
  it("accepts only Peach success-code families", () => {
    expect(isPeachSuccessCode("000.000.000")).toBe(true);
    expect(isPeachSuccessCode("000.100.110")).toBe(true);
    expect(isPeachSuccessCode("000.200.100")).toBe(false);
    expect(isPeachSuccessCode("100.396.101")).toBe(false);
  });

  it("keeps created and pending checkout events non-terminal", () => {
    expect(peachPaymentStatus("000.200.100")).toBe("pending");
    expect(peachPaymentStatus("000.200.000")).toBe("pending");
    expect(peachPaymentStatus("000.100.110")).toBe("paid");
    expect(peachPaymentStatus("000.100.110", false)).toBe("failed");
    expect(peachPaymentStatus("100.396.101")).toBe("failed");
  });

  it("formats the configured amount and currency", () => {
    const formatted = formatCheckoutPrice(2599, "zar");

    expect(formatted).toContain("ZAR");
    expect(formatted).toMatch(/25[,.]99/);
  });

  it("verifies Peach's timestamp, webhook id, URL and raw-body signature", async () => {
    const input = {
      secret: "test-secret",
      timestamp: "1787302800",
      webhookId: "webhook-123",
      url: "https://redflagdaddy.com/api/public/peach/webhook",
      rawBody: "amount=1.00&checkoutId=checkout-123&currency=USD&result.code=000.000.000",
    };
    const message = `${input.timestamp}.${input.webhookId}.${input.url}.${input.rawBody}`;
    const receivedSignature = createHmac("sha256", input.secret).update(message).digest("hex");

    await expect(verifyPeachWebhookSignature({ ...input, receivedSignature })).resolves.toBe(true);
    await expect(
      verifyPeachWebhookSignature({
        ...input,
        rawBody: `${input.rawBody}&tampered=true`,
        receivedSignature,
      }),
    ).resolves.toBe(false);
  });
});

describe("payment route contracts", () => {
  const paymentFunctions = readFileSync(
    new URL("./payments.functions.ts", import.meta.url),
    "utf8",
  );
  const webhook = readFileSync(
    new URL("../routes/api/public/peach.webhook.ts", import.meta.url),
    "utf8",
  );
  const upgrade = readFileSync(
    new URL("../routes/_authenticated/upgrade.tsx", import.meta.url),
    "utf8",
  );

  it("binds browser-side finalization to a stored checkout owned by the user", () => {
    expect(paymentFunctions).toContain("!settings?.paid_mode_enabled");
    expect(paymentFunctions).toContain('.eq("provider_ref", data.checkoutId)');
    expect(paymentFunctions).toContain('.eq("user_id", context.userId)');
    expect(paymentFunctions).toContain("amountMatches");
    expect(paymentFunctions).toContain("currencyMatches");
  });

  it("parses and verifies signed form webhooks before using stored ownership", () => {
    expect(webhook).toContain("verifyPeachWebhookSignature");
    expect(webhook).toContain("await request.text()");
    expect(webhook).toContain("new URLSearchParams(rawBody)");
    expect(webhook).toContain('.eq("provider_ref", checkoutId)');
    expect(webhook).toContain('.eq("id", payment.user_id)');
    expect(webhook).not.toContain("request.json()");
    expect(webhook).not.toContain("merchantCustomerId");
  });

  it("does not offer checkout while paid mode is disabled", () => {
    expect(upgrade).toContain("!ent.data.paidModeEnabled");
    expect(upgrade).toContain("there is nothing to purchase");
    expect(upgrade).not.toContain("$1.00");
    expect(upgrade).not.toContain("(sandbox)");
  });
});
