import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("action feedback surface", () => {
  it("mounts the app-wide notification surface", () => {
    const root = source("src/routes/__root.tsx");

    expect(root).toContain('import { Toaster } from "../components/ui/sonner"');
    expect(root).toContain('<Toaster position="top-center" richColors closeButton />');
  });

  it.each([
    "src/routes/_authenticated/create.tsx",
    "src/routes/_authenticated/journeys.$id.tsx",
    "src/routes/guest.tsx",
  ])("shows progress and failure feedback in %s", (path) => {
    const route = source(path);

    expect(route).toContain('sending ? "Sending…" : "Send SMS"');
    expect(route).toContain("toast.error");
  });

  it("exposes navigation and preference state to assistive technology", () => {
    const shell = source("src/components/AppShell.tsx");
    const settings = source("src/components/profile-settings.tsx");

    expect(shell).toContain('aria-current={active ? "page" : undefined}');
    expect(settings).toContain('aria-label="Back to profile"');
    expect(settings).toContain('role="switch"');
    expect(settings).toContain("aria-checked={value}");
  });

  it("gives administrator icon actions accessible names", () => {
    const admin = source("src/routes/_authenticated/admin.tsx");

    expect(admin).toContain("aria-label={`Edit category ${c.name}`}");
    expect(admin).toContain("aria-label={`Delete category ${c.name}`}");
  });
});
