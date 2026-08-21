/**
 * Expanded BDSM role taxonomy.
 *
 * Existing broad roles (Dominant / submissive / switch) are preserved.
 * New archetypes map back to one or more broad families so question filtering
 * and compatibility scoring stay stable.
 */

export const TOP_ROLES = [
  "Dominant",
  "Master",
  "sadist",
  "rope top",
  "service top",
  "degradation giver",
] as const;

export const BOTTOM_ROLES = [
  "submissive",
  "slave",
  "brat",
  "little",
  "pet",
  "masochist",
  "rope bottom",
  "service bottom",
  "degradation receiver",
] as const;

export const SWITCH_ROLES = [
  "switch",
  "primal",
  "caregiver",
  "exhibitionist",
  "voyeur",
] as const;

export const ALL_ROLES = [...TOP_ROLES, ...BOTTOM_ROLES, ...SWITCH_ROLES] as const;

export type Role = (typeof ALL_ROLES)[number];

export type BroadRole = "Dominant" | "submissive" | "switch";

/** Maps each archetype to the role tags it should match when filtering questions. */
export const ROLE_FAMILIES: Record<Role, Role[]> = {
  Dominant: ["Dominant"],
  Master: ["Dominant", "Master"],
  sadist: ["Dominant", "sadist"],
  "rope top": ["Dominant", "rope top"],
  "service top": ["Dominant", "service top"],
  "degradation giver": ["Dominant", "degradation giver"],
  exhibitionist: ["Dominant", "submissive", "switch", "exhibitionist"],
  submissive: ["submissive"],
  slave: ["submissive", "slave"],
  brat: ["submissive", "brat"],
  little: ["submissive", "little"],
  pet: ["submissive", "pet"],
  masochist: ["submissive", "masochist"],
  "rope bottom": ["submissive", "rope bottom"],
  "service bottom": ["submissive", "service bottom"],
  "degradation receiver": ["submissive", "degradation receiver"],
  voyeur: ["Dominant", "submissive", "switch", "voyeur"],
  switch: ["Dominant", "submissive", "switch"],
  primal: ["Dominant", "submissive", "switch", "primal"],
  caregiver: ["Dominant", "submissive", "switch", "caregiver"],
};

export function isRole(value: string): value is Role {
  return (ALL_ROLES as readonly string[]).includes(value);
}

/** Returns the broad family used for compatibility scoring. */
export function getBroadFamily(role: string): BroadRole {
  const r = role as Role;
  if (!isRole(r)) return "switch";
  const family = ROLE_FAMILIES[r];
  if (family.includes("submissive")) return "submissive";
  if (family.includes("Dominant")) return "Dominant";
  return "switch";
}

/** Expands an archetype into all role tags it should match for question filtering. */
export function expandRoleForFiltering(role: string): string[] {
  const r = role as Role;
  if (!isRole(r)) return [role];
  return [...ROLE_FAMILIES[r]];
}

export function oppositeRole(role: string): BroadRole {
  const broad = getBroadFamily(role);
  if (broad === "Dominant") return "submissive";
  if (broad === "submissive") return "Dominant";
  return "switch";
}
