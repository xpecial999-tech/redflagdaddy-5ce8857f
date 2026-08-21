import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readRoute = (name: string) =>
  readFileSync(new URL(`../routes/_authenticated/${name}`, import.meta.url), "utf8");

describe("signed-in help and safety surfaces", () => {
  it("does not present unimplemented safety controls as working features", () => {
    const safety = readRoute("profile.safety.tsx");

    expect(safety).not.toContain("Two-factor authentication");
    expect(safety).not.toContain("Panic exit");
    expect(safety).not.toContain("Stealth mode");
    expect(safety).not.toContain("Blocked accounts");
    expect(safety).not.toContain("Report a user");
    expect(safety).toContain("One-time SMS codes");
    expect(safety).toContain("supabase.auth.signOut()");
    expect(safety).toContain("not an emergency service");
  });

  it("links only to published help resources and makes no support SLA promise", () => {
    const help = readRoute("profile.help.tsx");

    expect(help).toContain('to: "/about"');
    expect(help).toContain('to: "/consent-safety"');
    expect(help).not.toContain("24 hours");
    expect(help).not.toContain("support@redflagdaddy.com");
    expect(help).not.toContain("min read");
  });

  it("exposes the working safety and help routes from the profile", () => {
    const profile = readRoute("profile.tsx");

    expect(profile).toContain('to="/profile/safety"');
    expect(profile).toContain('to="/profile/help"');
  });
});
