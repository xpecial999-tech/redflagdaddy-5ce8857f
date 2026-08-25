import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const FREE_QUESTION_CAP = 20;
export const FREE_JOURNEY_CAP = 2;
export const DEFAULT_QUESTION_LIMIT = 100;

async function loadSettings() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("paid_mode_enabled, price_cents, currency, construction_mode_enabled, construction_mode_updated_at")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) {
    console.error("[app-settings] Could not load settings", error);
    return {
      paidModeEnabled: false,
      priceCents: 100,
      currency: "USD",
      constructionModeEnabled: true,
      constructionModeUpdatedAt: null,
      settingsAvailable: false,
    };
  }
  return {
    paidModeEnabled: data.paid_mode_enabled,
    priceCents: data.price_cents,
    currency: data.currency,
    constructionModeEnabled: data.construction_mode_enabled,
    constructionModeUpdatedAt: data.construction_mode_updated_at,
    settingsAvailable: true,
  };
}

export async function loadEntitlement(userId: string | null) {
  const settings = await loadSettings();
  let isPaid = false;
  let isAdmin = false;
  let activeJourneys = 0;
  if (userId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [u, j, a] = await Promise.all([
      supabaseAdmin.from("users").select("is_paid").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("journeys")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", userId),
      supabaseAdmin.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);
    isPaid = !!u.data?.is_paid;
    activeJourneys = j.count ?? 0;
    isAdmin = !!a.data;
  }
  const enforce = settings.paidModeEnabled && !isPaid;
  const constructionBlocked = settings.constructionModeEnabled && !isAdmin;
  return {
    ...settings,
    isPaid,
    isAdmin,
    constructionBlocked,
    activeJourneys,
    freeQuestionCap: FREE_QUESTION_CAP,
    freeJourneyCap: FREE_JOURNEY_CAP,
    questionLimit: enforce ? FREE_QUESTION_CAP : DEFAULT_QUESTION_LIMIT,
    canDownloadReport: !enforce,
    canCreateJourney: !constructionBlocked && (!enforce || activeJourneys < FREE_JOURNEY_CAP),
    canDeepDive: !enforce,
  };
}

export const getEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadEntitlement(context.userId));

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => loadSettings());

async function assertAdminInline(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required.");
  return supabaseAdmin;
}

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await assertAdminInline(context.userId);
    const { data } = await sb
      .from("app_settings")
      .select("paid_mode_enabled, price_cents, currency, construction_mode_enabled, construction_mode_updated_at, updated_at")
      .eq("id", true)
      .maybeSingle();
    return data ?? {
      paid_mode_enabled: false,
      price_cents: 100,
      currency: "USD",
      construction_mode_enabled: true,
      construction_mode_updated_at: null,
    };
  });

export const setPaidMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdminInline(context.userId);
    const { error } = await sb
      .from("app_settings")
      .upsert({ id: true, paid_mode_enabled: data.enabled, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true as const, enabled: data.enabled };
  });

export const setConstructionMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdminInline(context.userId);
    const { data: previous, error: readError } = await sb
      .from("app_settings")
      .select("construction_mode_enabled, construction_mode_updated_at, updated_at")
      .eq("id", true)
      .maybeSingle();
    if (readError || !previous) throw new Error("Could not read the current construction-mode setting.");

    const changedAt = new Date().toISOString();
    const { error: updateError } = await sb
      .from("app_settings")
      .update({
        construction_mode_enabled: data.enabled,
        construction_mode_updated_at: changedAt,
        updated_at: changedAt,
      })
      .eq("id", true);
    if (updateError) throw new Error(updateError.message);

    const { error: auditError } = await sb.from("admin_settings_audit").insert({
      setting: "construction_mode_enabled",
      previous_value: previous.construction_mode_enabled,
      new_value: data.enabled,
      changed_by: context.userId,
      changed_at: changedAt,
    });
    if (auditError) {
      const { error: rollbackError } = await sb
        .from("app_settings")
        .update({
          construction_mode_enabled: previous.construction_mode_enabled,
          construction_mode_updated_at: previous.construction_mode_updated_at,
          updated_at: previous.updated_at,
        })
        .eq("id", true);
      if (rollbackError) console.error("[construction-mode] Audit rollback failed", rollbackError);
      throw new Error("Construction mode was not changed because its audit record could not be saved.");
    }

    return { ok: true as const, enabled: data.enabled, changedAt };
  });

export const listPublicCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cats, error } = await supabaseAdmin
    .from("question_categories")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  const { data: qs } = await supabaseAdmin
    .from("questions")
    .select("category_id")
    .eq("active", true);
  const counts = new Map<string, number>();
  for (const q of qs ?? []) counts.set(q.category_id as string, (counts.get(q.category_id as string) ?? 0) + 1);
  return {
    categories: (cats ?? []).map((c) => ({ id: c.id, name: c.name, count: counts.get(c.id) ?? 0 })),
  };
});
