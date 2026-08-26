import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const guestRoute = readFileSync(new URL("../routes/guest.tsx", import.meta.url), "utf8");
const guestFunctions = readFileSync(new URL("./guest.functions.ts", import.meta.url), "utf8");
const assessmentFunctions = readFileSync(
  new URL("./assessment.functions.ts", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL("../../supabase/migrations/20260826120000_anonymous_owner_codes.sql", import.meta.url),
  "utf8",
);

describe("anonymous journey privacy surface", () => {
  it("keeps the owner code out of URLs and browser storage", () => {
    expect(guestRoute).not.toContain("localStorage.setItem");
    expect(guestRoute).not.toContain("sessionStorage.setItem");
    expect(guestRoute).not.toMatch(/search:\s*\{[^}]*ownerCode/);
    expect(guestRoute).not.toMatch(/params:\s*\{[^}]*ownerCode/);
    expect(guestRoute).toContain('autoComplete="off"');
    expect(guestRoute).toContain("noindex,nofollow,noarchive");
  });

  it("stores only a hash and uses a distinct partner invite code", () => {
    expect(guestFunctions).toContain("anonymous_owner_code_hash: ownerCodeHash");
    expect(guestFunctions).not.toContain("anonymous_owner_code: ownerCode");
    expect(guestFunctions).toContain("const code = generateInviteCode()");
    expect(guestFunctions).toContain("generateOwnerCode()");
  });

  it("does not mint a share link or SMS the no-contact owner", () => {
    expect(assessmentFunctions).toContain("!owner?.anonymous_no_contact");
  });

  it("automatically deletes expired journeys and their cascading data", () => {
    expect(migration).toContain("delete_expired_anonymous_journeys");
    expect(migration).toContain("cron.schedule");
    expect(migration).toContain("anonymous_owner_expires_at <= now()");
  });
});
