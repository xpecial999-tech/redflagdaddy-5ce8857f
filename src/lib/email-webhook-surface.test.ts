import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authWebhook = readFileSync(
  new URL("../routes/lovable/email/auth/webhook.ts", import.meta.url),
  "utf8",
);
const suppressionWebhook = readFileSync(
  new URL("../routes/lovable/email/suppression.ts", import.meta.url),
  "utf8",
);

describe("legacy email webhook safety surface", () => {
  it("bounds and validates verified Auth email payloads before enqueueing", () => {
    expect(authWebhook).toContain("MAX_WEBHOOK_BODY_BYTES");
    expect(authWebhook).toContain("declaredLength > MAX_WEBHOOK_BODY_BYTES");
    expect(authWebhook).toContain("new URL(data.url).protocol !== 'https:'");
    expect(authWebhook).toContain("pendingLogError");
    expect(authWebhook).not.toContain("error: enqueueError, run_id");
    expect(authWebhook).not.toContain("Unsupported payload version: ${payload.version}");
  });

  it("validates suppression fields and avoids raw operational error messages", () => {
    expect(suppressionWebhook).toContain("SuppressionPayloadSchema.parse(parsed.data)");
    expect(suppressionWebhook).toContain("declaredLength > MAX_WEBHOOK_BODY_BYTES");
    expect(suppressionWebhook).not.toContain("message: suppressError.message");
    expect(suppressionWebhook).not.toContain("message: insertError.message");
  });
});
