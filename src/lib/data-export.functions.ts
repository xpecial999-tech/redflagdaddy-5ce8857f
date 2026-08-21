import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, prefsRes, journeysRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("journeys")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const journeys = journeysRes.data ?? [];
    const journeyIds = journeys.map((j) => j.id);

    let responses: unknown[] = [];
    let results: unknown[] = [];
    let invites: unknown[] = [];

    if (journeyIds.length > 0) {
      const [rRes, resRes, iRes] = await Promise.all([
        supabase.from("responses").select("*").in("journey_id", journeyIds),
        supabase.from("results").select("*").in("journey_id", journeyIds),
        supabase.from("invites").select("*").in("journey_id", journeyIds),
      ]);
      responses = rRes.data ?? [];
      results = resRes.data ?? [];
      invites = iRes.data ?? [];
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: profileRes.data ?? null,
      preferences: prefsRes.data ?? null,
      journeys,
      invites,
      responses,
      results,
    };

    return { json: JSON.stringify(payload, null, 2) };
  });
