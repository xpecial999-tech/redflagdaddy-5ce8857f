import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const login = readFileSync(new URL("../routes/login.tsx", import.meta.url), "utf8");
const callback = readFileSync(new URL("../routes/auth.callback.tsx", import.meta.url), "utf8");
const alternatives = readFileSync(
  new URL("../components/AlternativeAuthMethods.tsx", import.meta.url),
  "utf8",
);
const linking = readFileSync(
  new URL("../components/LinkedAuthMethods.tsx", import.meta.url),
  "utf8",
);

describe("authentication alternatives surface", () => {
  it("allows the dedicated administrator login to use the configured email method", () => {
    expect(login).toContain('mode={adminOnly ? "admin" : "login"}');
    expect(alternatives).toContain('mode === "admin" ? "/admin" : "/dashboard"');
  });

  it("uses an allow-listed, no-index callback", () => {
    expect(callback).toContain('z.enum(["/admin", "/dashboard", "/profile"])');
    expect(callback).toContain("noindex,nofollow,noarchive");
    expect(callback).toContain("no-referrer");
    expect(callback).toContain("exchangeCodeForSession");
  });

  it("does not reveal whether an email address has an account", () => {
    expect(alternatives).toContain("If this email can be used");
    expect(alternatives).not.toMatch(/user not found|email already exists/i);
  });

  it("provides explicit linking for current phone users", () => {
    expect(linking).toContain("linkIdentity");
    expect(linking).toContain("Mobile SMS stays available as a recovery method");
    expect(linking).not.toContain("unlinkIdentity");
  });

  it("does not add unsupported Telegram or Signal automation", () => {
    expect(alternatives + linking).not.toMatch(/telegram|signal/i);
  });
});
