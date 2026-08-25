import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const publicJourneySurfaces = [
  "src/components/ReportView.tsx",
  "src/routes/about.tsx",
  "src/routes/_authenticated/create.tsx",
  "src/routes/_authenticated/dashboard.tsx",
  "src/routes/_authenticated/journeys.$id.tsx",
  "src/routes/guest.tsx",
  "src/routes/demo-report.tsx",
];

describe("plain-language partner terminology", () => {
  it.each(publicJourneySurfaces)("keeps jargon out of visible copy in %s", (path) => {
    const route = source(path);

    expect(route).not.toMatch(/\brespondents?\b/i);
    expect(route).not.toMatch(/\brecipient(?:'s)? (?:details|name|mobile)\b/i);
    expect(route).not.toMatch(/\bparticipant (?:name|mobile|type)\b/i);
  });

  it("uses partner language across the core journey", () => {
    expect(source("src/routes/_authenticated/create.tsx")).toContain("Partner details");
    expect(source("src/routes/_authenticated/journeys.$id.tsx")).toContain("Partner progress");
    expect(source("src/routes/_authenticated/journeys.$id.tsx")).toContain("Send to partner");
    expect(source("src/components/ReportView.tsx")).toContain("partner role:");
  });
});
