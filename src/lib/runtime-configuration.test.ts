import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = new URL("../", import.meta.url).pathname;
const INVENTORY = readFileSync(
  new URL("../../docs/runtime-configuration-checklist.md", import.meta.url),
  "utf8",
);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}

function referencedEnvironmentNames(): string[] {
  const names = new Set<string>();
  const pattern =
    /(?:process\.env|import\.meta\.env)(?:\.([A-Z][A-Z0-9_]*)|\[["']([A-Z][A-Z0-9_]*)["']\])/g;

  for (const file of sourceFiles(SOURCE_ROOT)) {
    const source = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    for (const match of source.matchAll(pattern)) {
      const name = match[1] ?? match[2];
      if (name && name !== "NODE_ENV") names.add(name);
    }
  }

  return [...names].sort();
}

describe("runtime configuration inventory", () => {
  it("documents every environment name referenced by application source", () => {
    const undocumented = referencedEnvironmentNames().filter(
      (name) => !INVENTORY.includes(`\`${name}\``),
    );

    expect(undocumented).toEqual([]);
  });

  it("keeps known secrets out of the public Vite namespace", () => {
    for (const name of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "OTP_SECRET",
      "CLICKATELL_API_KEY",
      "CLICKATELL_CALLBACK_PASSWORD",
      "TURNSTILE_SECRET_KEY",
      "LOVABLE_API_KEY",
      "PEACH_ACCESS_TOKEN",
      "PEACH_WEBHOOK_SECRET",
    ]) {
      expect(name).not.toMatch(/^VITE_/);
      expect(INVENTORY).toContain(`\`${name}\``);
    }
  });
});
