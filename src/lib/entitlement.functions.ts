import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const FREE_QUESTION_CAP = 20;
export const FREE_JOURNEY_CAP = 2;
export const DEFAULT_QUESTION_LIMIT = 100;

async function loadSettings() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("paid_mode_enabled, price_cents, currency")
    .eq("id", true)
    .maybeSingle();
  return {
    paidModeEnabled: !!data?.paid_mode_enabled,
    priceCents: data?.price_cents ?? 100,
    currency: data?.currency ?? "USD",
  };
}

export async function loadEntitlement(userId: string | null) {
  const settings = await loadSettings();
  let isPaid = false;
  let activeJourneys = 0;
  if (userId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [u, j] = await Promise.all([
      supabaseAdmin.from("users").select("is_paid").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("journeys")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", userId),
    ]);
    isPaid = !!u.data?.is_paid;
    activeJourneys = j.count ?? 0;
  }
  const enforce = settings.paidModeEnabled && !isPaid;
  return {
    ...settings,
    isPaid,
    activeJourneys,
    freeQuestionCap: FREE_QUESTION_CAP,
    freeJourneyCap: FREE_JOURNEY_CAP,
    questionLimit: enforce ? FREE_QUESTION_CAP : DEFAULT_QUESTION_LIMIT,
    canDownloadReport: !enforce,
    canCreateJourney: !enforce || activeJourneys < FREE_JOURNEY_CAP,
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
      .select("paid_mode_enabled, price_cents, currency, updated_at")
      .eq("id", true)
      .maybeSingle();
    return data ?? { paid_mode_enabled: false, price_cents: 100, currency: "USD" };
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
