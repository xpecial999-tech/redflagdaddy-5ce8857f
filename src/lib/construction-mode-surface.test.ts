import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("construction mode", () => {
  it("ships the approved accessible construction artwork", () => {
    const component = source("src/components/ConstructionPage.tsx");
    const image = readFileSync(new URL("../../public/under-construction.png", import.meta.url));

    expect(component).toContain('src="/under-construction.png"');
    expect(component).toContain('id="construction-title"');
    expect(component).toContain("private assessment or report link");
    expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1122);
    expect(image.readUInt32BE(20)).toBe(1402);
  });

  it("adds a public setting and private administrator audit trail", () => {
    const migration = source("supabase/migrations/20260825090000_construction_mode.sql");

    expect(migration).toContain("construction_mode_enabled boolean NOT NULL DEFAULT false");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.admin_settings_audit");
    expect(migration).toContain('CREATE POLICY "admins read settings audit"');
  });

  it("enforces the setting inside every new-journey server action", () => {
    expect(source("src/lib/guest.functions.ts")).toContain("await assertJourneyCreationAllowed()");
    expect(source("src/lib/journeys.functions.ts")).toContain(
      "await assertJourneyCreationAllowed(userId)",
    );
  });

  it("blocks ordinary OTP entry while preserving the dedicated admin purpose", () => {
    const phoneAuth = source("src/lib/phone-auth.functions.ts");
    const login = source("src/routes/login.tsx");
    const register = source("src/routes/register.tsx");

    expect(phoneAuth).toContain("await assertOtpPurposeAllowed(data.purpose, data.phone)");
    expect(login).toContain('adminOnly ? "admin" : "login"');
    expect(register).toContain('purpose: "register"');
  });

  it("keeps existing private assessment and report routes outside the construction guard", () => {
    for (const path of [
      "src/routes/assessment.$code.tsx",
      "src/routes/journey.$code.tsx",
      "src/routes/j.$code.tsx",
      "src/routes/report.$token.tsx",
    ]) {
      expect(source(path)).not.toContain("construction-mode");
    }
  });

  it("provides a confirmed admin toggle and hides public conversion controls", () => {
    const admin = source("src/routes/_authenticated/admin.tsx");
    const shell = source("src/components/AppShell.tsx");
    const landing = source("src/routes/index.tsx");

    expect(admin).toContain("setConstructionMode");
    expect(admin).toContain("Enable construction mode?");
    expect(admin).toContain("<Login adminOnly />");
    expect(shell).toContain("!construction.enabled");
    expect(landing).toContain("<ConstructionPage />");
  });
});
