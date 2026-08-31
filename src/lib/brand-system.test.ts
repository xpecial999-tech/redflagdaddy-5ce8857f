import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

function pngSize(path: string): { width: number; height: number } {
  const image = readFileSync(new URL(`../../${path}`, import.meta.url));
  expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

describe("approved brand system", () => {
  it("maps the application theme to the approved tokens and fonts", () => {
    const tokens = source("src/brand-tokens.css");
    const styles = source("src/styles.css");
    const root = source("src/routes/__root.tsx");

    expect(tokens).toContain("--rfd-ink-950: #08070e");
    expect(tokens).toContain("--rfd-signal-pink: #f340a6");
    expect(tokens).toContain('--rfd-font-display: "DM Serif Display"');
    expect(styles).toContain("--background: var(--rfd-ink-950)");
    expect(styles).toContain("--primary: var(--rfd-signal-pink)");
    expect(root).toContain("family=DM+Serif+Display");
    expect(root).not.toContain("Fraunces");
    expect(source("src/components/AppShell.tsx")).toContain('w-[180px] sm:w-[240px]');
  });

  it("uses the approved emblem and direct recovery copy for missing routes", () => {
    const root = source("src/routes/__root.tsx");

    expect(root).toContain('src="/favicon.png"');
    expect(root).toContain("This route doesn’t exist.");
    expect(root).toContain("Return home");
  });

  it("publishes the approved emblem at every browser and app-icon size", () => {
    expect(pngSize("public/favicon.png")).toEqual({ width: 64, height: 64 });
    expect(pngSize("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
    expect(pngSize("public/icon-256.png")).toEqual({ width: 256, height: 256 });
    expect(pngSize("public/icon-512.png")).toEqual({ width: 512, height: 512 });
    expect(readFileSync(new URL("../../public/favicon.ico", import.meta.url)).length).toBeGreaterThan(1_000);
  });

  it("uses a valid install manifest with the approved dark theme", () => {
    const manifest = JSON.parse(source("public/manifest.webmanifest"));

    expect(manifest).toMatchObject({
      name: "RedFlagDaddy",
      short_name: "RFD",
      background_color: "#08070E",
      theme_color: "#08070E",
      display: "standalone",
    });
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual([
      "256x256",
      "512x512",
    ]);
  });
});
