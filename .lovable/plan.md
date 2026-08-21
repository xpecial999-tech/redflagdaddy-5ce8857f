# Expand role taxonomy to BDSM archetypes

## Goal
Add a richer set of BDSM archetypes beyond Dominant / submissive / switch while keeping existing users unchanged. New roles must feed into the existing question-filtering engine so each user sees relevant questions.

## Proposed archetypes
Add these to the role enums, grouped by broad family for filtering:

- **Top / leading family:** Dominant, Master/Mistress, sadist, rope top, service top, degradation giver, exhibitionist
- **Bottom / receiving family:** submissive, slave, brat, little, pet, masochist, rope bottom, service bottom, degradation receiver, voyeur
- **Switch / fluid family:** switch, primal, caregiver (can lean either)

Existing users keep `Dominant`, `submissive`, or `switch`. New users can pick any archetype.

## Plan

### 1. Database schema
- Extend `public.user_role` enum with the new archetypes via `ALTER TYPE ... ADD VALUE`.
- Extend `public.participant_type` enum the same way (keep `any`).
- No data migration needed; existing rows stay valid.

### 2. Role-family mapping
- Add a code-side constant that maps every archetype to its broad family set, e.g.:
  - `brat` -> `["submissive", "brat"]`
  - `Master/Mistress` -> `["Dominant", "Master/Mistress"]`
  - `switch` -> `["Dominant", "submissive", "switch"]`
- Use this mapping when fetching questions so a user sees questions tagged for their specific archetype AND their broad family.

### 3. Forms and validation
- Update `src/routes/register.tsx` role selector to show the expanded list, grouped by family.
- Update `src/routes/guest.tsx` partner-type selector similarly.
- Update `src/routes/_authenticated/create.tsx` participant-type selector.
- Update Zod schemas in `src/lib/guest.functions.ts`, `src/lib/journeys.functions.ts`, `src/lib/phone-auth.server.ts`, and `src/lib/admin.functions.ts` to accept the new enum values.

### 4. Admin question tagging
- Update the AI prompt in `src/lib/admin.functions.ts` so it can tag questions with any archetype, with guidance on when to use broad vs. specific tags.
- Update the Zod schema for `applies_to` to allow the full archetype set.

### 5. Question fetching
- Update the assessment question loader to expand the respondent's role into its family set and query `applies_to && expandedSet`.
- Keep compatibility scoring on the broad family (Dominant/submissive/switch) so existing logic stays stable.

### 6. Marketing copy
- Update role mentions on `src/routes/index.tsx`, `src/routes/about.tsx`, and `src/routes/__root.tsx` to reflect the broader archetype support.

## Out of scope for this plan
- Re-tagging existing questions automatically (admin can re-run AI tagging if desired).
- Changing the compatibility algorithm beyond broad-family matching.

## Verification
- Type-check passes after enum/schema updates.
- Register, guest, and create-journey forms display the new roles grouped by family.
- Creating a journey with a new archetype still loads the correct trimmed question set.
- Existing users with `Dominant`/`submissive`/`switch` see the same questions as before.
