import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("public launch surface", () => {
  it("does not ship the unused demonstration server action", () => {
    expect(existsSync(new URL("../lib/api/example.functions.ts", import.meta.url))).toBe(false);
  });

  it("publishes only approved public pages in the sitemap", () => {
    const sitemap = source("public/sitemap.xml");
    expect(sitemap).toContain("https://redflagdaddy.com/about");
    expect(sitemap).toContain("https://redflagdaddy.com/demo-report");
    expect(sitemap).toContain("https://redflagdaddy.com/support");
    expect(sitemap).not.toMatch(/assessment|journey|report\/|results|dashboard|login/);
  });

  it("publishes a first-party support route without exposing the forwarding inbox", () => {
    const support = source("src/routes/support.tsx");
    const supportAction = source("src/lib/support.functions.ts");

    expect(support).toContain("support@redflagdaddy.com");
    expect(support).toContain("Find A Helpline");
    expect(support).toContain("not continuously monitored");
    expect(support).toContain("cf-turnstile");
    expect(supportAction).toContain('process.env["TURNSTILE_SECRET_KEY"]');
    expect(supportAction).toContain('result.action !== "support_request"');
    expect(supportAction).toContain('action: "support_request_ip"');
    expect(`${support}\n${supportAction}`).not.toMatch(/redflagdaddy\.app@gmail\.com/i);
  });

  it("keeps account and guest intake forms out of search indexes", () => {
    for (const route of ["src/routes/register.tsx", "src/routes/guest.tsx"]) {
      expect(source(route)).toContain("noindex, nofollow, noarchive");
    }
  });

  it("rotates revoked report links and returns a safe lookup error", () => {
    const analysis = source("src/lib/analysis.functions.ts");
    expect(analysis).toContain("!existing.share_enabled");
    expect(analysis).toContain('console.error("[shared-report] Lookup failed"');
    expect(analysis).toContain('throw new Error("This shared report is unavailable.")');
  });

  it("does not expose database messages from public journey endpoints", () => {
    for (const path of [
      "src/lib/assessment.functions.ts",
      "src/lib/guest.functions.ts",
      "src/lib/invites.functions.ts",
    ]) {
      const endpoint = source(path);
      expect(endpoint).toContain("throwPublicDataError");
      expect(endpoint).not.toMatch(/throw new Error\([^\n]*\.message\)/);
    }
    expect(source("src/lib/entitlement.functions.ts")).toContain(
      'throwPublicDataError(error, "load public categories")',
    );
  });

  it("uses scalable phone identity lookup and cleans up incomplete account journeys", () => {
    const phoneAuth = source("src/lib/phone-auth.server.ts");
    expect(phoneAuth).toContain('.eq("phone", data.phone)');
    expect(phoneAuth).toContain("getUserById");
    expect(phoneAuth).not.toContain("listUsers");
    expect(phoneAuth).toContain("SMS_SEND_FAILURE_MESSAGE");
    expect(phoneAuth).not.toContain("throw new Error(message?.errorDescription");
    expect(phoneAuth).not.toContain("Clickatell error:");
    expect(phoneAuth).toContain('.eq("attempts", row.attempts)');
    expect(phoneAuth).toContain("if (!consumed) return { error: GENERIC_VERIFY_ERROR }");

    const journeys = source("src/lib/journeys.functions.ts");
    expect(journeys).toContain("Incomplete journey cleanup failed");
    expect(journeys).toContain('.from("journeys")\n        .delete()');
  });

  it("rate-limits public bearer-code and report lookups", () => {
    expect(source("src/lib/invites.functions.ts")).toContain('action: "invite_validate_ip"');
    expect(source("src/lib/assessment.functions.ts")).toContain('action: "assessment_load_ip"');
    expect(source("src/lib/assessment.functions.ts")).toContain('action: "assessment_complete_ip"');
    expect(source("src/lib/analysis.functions.ts")).toContain('action: "shared_report_ip"');
  });

  it("finalizes an invite once and never texts a dead guest-report link", () => {
    const assessments = source("src/lib/assessment.functions.ts");
    expect(assessments).toContain('.is("completed_at", null)');
    expect(assessments).toContain("if (!completedInvite)");
    expect(assessments).toContain("if (shareError)");
    expect(assessments.indexOf("if (shareError)")).toBeLessThan(
      assessments.lastIndexOf("guestReportUrl ="),
    );
    expect(assessments).not.toContain('your "${String(journey.title)}" report');
  });

  it("retires the legacy authenticated-user transactional email sender", () => {
    const legacySend = source("src/routes/lovable/email/transactional/send.ts");
    expect(legacySend).toContain("Retired legacy client-send endpoint");
    expect(legacySend).toContain("status: 404");
    expect(legacySend).not.toContain("recipientEmail");
    expect(legacySend).not.toContain("enqueue_email");
  });

  it("uses one validated public origin for account and guest invite links", () => {
    const journeys = source("src/lib/journeys.functions.ts");
    const guests = source("src/lib/guest.functions.ts");
    const assessments = source("src/lib/assessment.functions.ts");
    expect(journeys).toContain("publicInviteUrl");
    expect(guests).toContain("publicInviteUrl");
    expect(journeys).not.toContain("journey.invite_url ??");
    expect(guests).not.toContain("journey.invite_url ??");
    expect(`${journeys}\n${guests}`).not.toContain('process.env["PUBLIC_SITE_URL"]');
    expect(`${journeys}\n${guests}`).not.toContain("process.env.PUBLIC_APP_URL");
    expect(assessments).toContain("publicSiteOrigin");
    expect(assessments).not.toMatch(/https:\/\/redflagdaddy\.com\/(report|results)\//);
  });

  it("advertises the sitemap while blocking sensitive route families", () => {
    const robots = source("public/robots.txt");
    expect(robots).toContain("Sitemap: https://redflagdaddy.com/sitemap.xml");
    for (const route of ["/assessment/", "/journey/", "/report/", "/results/"]) {
      expect(robots).toContain(`Disallow: ${route}`);
    }
  });

  it("does not restore obsolete hosting metadata or unsupported claims", () => {
    const root = source("src/routes/__root.tsx");
    const about = source("src/routes/about.tsx");
    expect(root).not.toMatch(/lovable\.app|r2\.dev/);
    expect(about).not.toMatch(
      /research-grounded|end-to-end privacy|Verified mobile accounts only|Adaptive questioning/,
    );
  });

  it("keeps account creation primary and the public safety boundary explicit", () => {
    const landing = source("src/routes/index.tsx");
    const accountCta = landing.indexOf("Create an account");
    const guestCta = landing.indexOf("Continue as guest");

    expect(accountCta).toBeGreaterThan(-1);
    expect(guestCta).toBeGreaterThan(accountCta);
    expect(landing).toContain("a background check");
    expect(landing).toContain("proof of consent");
    expect(landing).toContain("a guarantee of");
    expect(landing).toContain("Structured conversations for adults");
    expect(landing).not.toContain("Structured assessments for");
  });

  it("serves the full-size header logo from local public assets", () => {
    const shell = source("src/components/AppShell.tsx");
    const logo = readFileSync(new URL("../../public/logo.png", import.meta.url));

    expect(shell).toContain('src="/logo.png"');
    expect(shell).not.toContain("/__l5e/");
    expect(logo.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(logo.readUInt32BE(16)).toBe(1200);
    expect(logo.readUInt32BE(20)).toBe(400);
  });
});
