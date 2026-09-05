export const CONSTRUCTION_MODE_MESSAGE =
  "RedFlagDaddy is temporarily closed to new journeys while we make improvements.";

export type ConstructionModeState = {
  enabled: boolean;
  updatedAt: string | null;
  statusAvailable: boolean;
};

function workerConstructionMode(): boolean | undefined {
  const buildMode = import.meta.env.VITE_CONSTRUCTION_MODE;
  if (buildMode === "enabled") return true;
  if (buildMode === "disabled") return false;

  const runtime = (
    globalThis as typeof globalThis & {
      __env__?: Record<string, unknown>;
    }
  ).__env__;

  if (runtime?.CONSTRUCTION_MODE === "enabled") return true;
  if (runtime?.CONSTRUCTION_MODE === "disabled") return false;
  return undefined;
}

export async function loadConstructionMode(
  options: { strict?: boolean } = {},
): Promise<ConstructionModeState> {
  const workerMode = workerConstructionMode();
  if (workerMode !== undefined) {
    return { enabled: workerMode, updatedAt: null, statusAvailable: true };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("construction_mode_enabled, construction_mode_updated_at")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    console.error("[construction-mode] Could not load app setting", error);
    if (options.strict) {
      throw new Error("Could not verify whether new journeys are available. Please try again.");
    }
    return { enabled: true, updatedAt: null, statusAvailable: false };
  }

  return {
    enabled: data.construction_mode_enabled,
    updatedAt: data.construction_mode_updated_at,
    statusAvailable: true,
  };
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Could not verify administrator access.");
  return !!data;
}

export async function assertJourneyCreationAllowed(userId?: string | null): Promise<void> {
  const state = await loadConstructionMode({ strict: true });
  if (!state.enabled) return;
  if (userId && (await isAdminUser(userId))) return;
  throw new Error(CONSTRUCTION_MODE_MESSAGE);
}

export async function assertOtpPurposeAllowed(
  purpose: "login" | "register" | "admin",
  phone: string,
): Promise<void> {
  if (purpose === "admin") {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (userError) throw new Error("Could not verify administrator access.");
    if (!user || !(await isAdminUser(user.id))) {
      throw new Error("Administrator sign-in is unavailable for this account.");
    }
    return;
  }

  const state = await loadConstructionMode({ strict: true });
  if (state.enabled) throw new Error(CONSTRUCTION_MODE_MESSAGE);
}
