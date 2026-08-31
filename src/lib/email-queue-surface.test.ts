import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./email/queue.server.ts", import.meta.url), "utf8");

describe("transactional email queue safety", () => {
  it("never sends an unsubscribe token that was not confirmed in storage", () => {
    expect(source).toContain("if (tokenInsertError)");
    expect(source).toContain("if (storedTokenError || !stored?.token)");
    expect(source).toContain("unsubscribeToken = stored.token");
    expect(source).not.toContain("stored?.token ?? token");
  });

  it("keeps database/provider details out of operational email errors", () => {
    expect(source).toContain("code: enqueueError.code");
    expect(source).not.toContain("message: enqueueError.message");
    expect(source).not.toContain("console.error('[email] send failed', e)");
  });
});
