import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const journeysFunctions = readFileSync(new URL("./journeys.functions.ts", import.meta.url), "utf8");
const createRoute = readFileSync(
  new URL("../routes/_authenticated/create.tsx", import.meta.url),
  "utf8",
);
const journeyRoute = readFileSync(
  new URL("../routes/_authenticated/journeys.$id.tsx", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL("../../supabase/migrations/20260909211000_journey_pairs.sql", import.meta.url),
  "utf8",
);

describe("journey pair surface", () => {
  it("adds explicit owner and partner pairing columns", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.journey_pairs");
    expect(migration).toContain("owner_journey_id uuid NOT NULL");
    expect(migration).toContain("partner_journey_id uuid NOT NULL");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS pair_id uuid");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS pair_side text");
    expect(migration).toContain("pair_side IN ('owner', 'partner')");
  });

  it("creates self-assessments through the pair-aware server function", () => {
    expect(journeysFunctions).toContain("createSelfAssessmentForJourney");
    expect(journeysFunctions).toContain('pair_side: "owner"');
    expect(journeysFunctions).toContain('pair_side: "partner"');
    expect(journeysFunctions).toContain("This journey already has a linked self-assessment.");
    expect(createRoute).toContain("createSelfAssessmentForJourney");
    expect(journeyRoute).toContain("createSelfAssessmentForJourney");
  });

  it("does not invite repeated self-assessment creation on the owner side", () => {
    expect(journeyRoute).toContain('journey.pair_side === "owner"');
    expect(journeyRoute).toContain("!isOwnerSide && <SelfAssessmentCard");
  });
});
