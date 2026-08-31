import { describe, expect, it } from "vitest";
import { isPrivateApplicationPath, withSecurityHeaders } from "./security-headers";

describe("HTTP security headers", () => {
  it("recognizes private and public application paths", () => {
    for (const path of [
      "/login",
      "/guest",
      "/assessment/private-code",
      "/report/private-token",
      "/api/public/sms/status",
      "/profile/help",
    ]) {
      expect(isPrivateApplicationPath(path), path).toBe(true);
    }
    for (const path of ["/", "/about", "/support", "/consent-safety", "/demo-report"]) {
      expect(isPrivateApplicationPath(path), path).toBe(false);
    }
  });

  it("adds baseline protections without caching or indexing private pages", () => {
    const original = new Response("private", {
      headers: { "content-type": "text/plain", "set-cookie": "session=test; HttpOnly" },
    });
    const response = withSecurityHeaders(original, {
      pathname: "/report/token",
    });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.headers.get("set-cookie")).toBe("session=test; HttpOnly");
  });

  it("keeps public caching available while protecting server-function responses", () => {
    const publicResponse = withSecurityHeaders(new Response("public"), { pathname: "/about" });
    expect(publicResponse.headers.get("cache-control")).toBeNull();
    expect(publicResponse.headers.get("x-robots-tag")).toBeNull();

    const serverResponse = withSecurityHeaders(new Response("rpc"), {
      pathname: "/_server/example",
      serverFunction: true,
    });
    expect(serverResponse.headers.get("cache-control")).toBe("no-store");
    expect(serverResponse.headers.get("x-robots-tag")).toContain("noindex");
  });
});
