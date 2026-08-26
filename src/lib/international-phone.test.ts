import { describe, expect, it } from "vitest";
import { countryFromPhone, formatPhone, isValidE164, toE164 } from "./phone";
import { normalizeCountryHint } from "./phone-country.functions";
import { readFileSync } from "node:fs";

describe("international phone normalization", () => {
  it("normalizes national numbers using the selected country", () => {
    expect(toE164("082 123 4567", "ZA")).toBe("+27821234567");
    expect(toE164("020 7946 0018", "GB")).toBe("+442079460018");
    expect(toE164("(415) 555-2671", "US")).toBe("+14155552671");
  });

  it("preserves and formats valid international input", () => {
    expect(toE164("+44 20 7946 0018", "ZA")).toBe("+442079460018");
    expect(isValidE164("+442079460018")).toBe(true);
    expect(formatPhone("+442079460018")).toContain("+44");
    expect(countryFromPhone("+442079460018")).toBe("GB");
  });

  it("uses South Africa for absent or unsupported Cloudflare hints", () => {
    expect(normalizeCountryHint("gb")).toBe("GB");
    expect(normalizeCountryHint(null)).toBe("ZA");
    expect(normalizeCountryHint("XX")).toBe("ZA");
  });

  it("routes every mobile entry surface through the shared component", () => {
    const files = [
      "routes/login.tsx",
      "routes/register.tsx",
      "routes/_authenticated/create.tsx",
      "routes/_authenticated/journeys.$id.tsx",
      "routes/guest.tsx",
    ];
    const sources = files.map((file) =>
      readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    );
    expect(sources.join("\n").match(/<InternationalPhoneInput/g)).toHaveLength(7);
    expect(sources.join("\n")).not.toContain('type="tel"');
  });

  it("uses only Cloudflare's country hint and never reads or returns an IP", () => {
    const source = readFileSync(new URL("./phone-country.functions.ts", import.meta.url), "utf8");
    expect(source).toContain('getRequestHeader("cf-ipcountry")');
    expect(source).not.toContain("cf-connecting-ip");
    expect(source).not.toContain("x-forwarded-for");
  });
});
