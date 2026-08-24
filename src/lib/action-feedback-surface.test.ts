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
});
