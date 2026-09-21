import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const migration = source(
  "../../supabase/migrations/20260921121500_claimed_journey_participants.sql",
);
const guestFunctions = source("./guest.functions.ts");
const journeyFunctions = source("./journeys.functions.ts");
const analysisFunctions = source("./analysis.functions.ts");
const assessmentRoute = source("../routes/assessment.$code.tsx");
const journeyRoute = source("../routes/_authenticated/journeys.$id.tsx");

describe("completed partner journey account claim", () => {
  it("stores the respondent separately from the journey creator", () => {
    expect(migration).toContain("participant_user_id uuid REFERENCES auth.users(id)");
    expect(migration).toContain('CREATE POLICY "Participants read claimed journeys"');
    expect(migration).toContain('CREATE POLICY "Participants read claimed results"');
    expect(guestFunctions).toContain("participant_user_id: context.userId");
    expect(guestFunctions).not.toContain(
      "if (journey.creator_id) {\n      if (journey.creator_id === context.userId)",
    );
  });

  it("includes claimed journeys in the participant dashboard and report access", () => {
    expect(journeyFunctions).toContain("participant_user_id");
    expect(journeyFunctions).toContain('"participant" as const');
    expect(analysisFunctions).toContain("journey.participant_user_id === userId");
    expect(analysisFunctions).toContain("ownerOnly: true");
  });

  it("restores the completion screen and offers an authenticated retry", () => {
    expect(assessmentRoute).toContain("if (data.invite.completed_at) setSubmitted(true)");
    expect(assessmentRoute).toContain("Save to my account");
    expect(journeyRoute).toContain('viewerRelation === "participant"');
    expect(journeyRoute).toContain("!isParticipantViewer &&");
  });
});
