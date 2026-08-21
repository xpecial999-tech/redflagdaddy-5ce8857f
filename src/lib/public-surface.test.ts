import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("public launch surface", () => {
  it("publishes only approved public pages in the sitemap", () => {
    const sitemap = source("public/sitemap.xml");
    expect(sitemap).toContain("https://redflagdaddy.com/about");
    expect(sitemap).toContain("https://redflagdaddy.com/demo-report");
    expect(sitemap).not.toMatch(/assessment|journey|report\/|results|dashboard|login/);
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
});
