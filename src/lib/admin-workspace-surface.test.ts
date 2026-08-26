import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("dedicated administrator workspace", () => {
  it("keeps the admin entry authorised and out of search", () => {
    const admin = source("src/routes/_authenticated/admin.tsx");
    expect(admin).toContain("isCurrentUserAdmin");
    expect(admin).toContain("noindex,nofollow");
    expect(admin).toContain("<Login adminOnly />");
  });

  it("provides a separate responsive workspace and overview", () => {
    const admin = source("src/routes/_authenticated/admin.tsx");
    expect(admin).toContain("Administrator workspace");
    expect(admin).toContain('id: "overview"');
    expect(admin).toContain('id: "questions"');
    expect(admin).toContain('id: "categories"');
    expect(admin).toContain('id: "journeys"');
    expect(admin).toContain('id: "analytics"');
    expect(admin).toContain('id: "settings"');
    expect(admin).toContain("Return to app");
    expect(admin).toContain('aria-label="Admin sections"');
  });

  it("uses the wide shell and keeps the ordinary bottom navigation away", () => {
    const shell = source("src/components/AppShell.tsx");
    expect(shell).toContain('const adminWorkspace = pathname === "/admin"');
    expect(shell).toContain('adminWorkspace ? "max-w-7xl pb-10"');
    expect(shell).toContain('pathname === "/admin"');
  });
});
