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

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull profile so we can clean up phone-scoped logs if possible
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();

    // Collect all journeys owned by this user
    const { data: journeys } = await supabaseAdmin
      .from("journeys")
      .select("id")
      .eq("creator_id", userId);
    const journeyIds = (journeys ?? []).map((j) => j.id);

    // Clean up journey-related data first
    if (journeyIds.length > 0) {
      const { error: rErr } = await supabaseAdmin
        .from("responses")
        .delete()
        .in("journey_id", journeyIds);
      if (rErr) throw new Error(rErr.message);

      const { error: resErr } = await supabaseAdmin
        .from("results")
        .delete()
        .in("journey_id", journeyIds);
      if (resErr) throw new Error(resErr.message);

      const { error: iErr } = await supabaseAdmin
        .from("invites")
        .delete()
        .in("journey_id", journeyIds);
      if (iErr) throw new Error(iErr.message);

      const { error: jErr } = await supabaseAdmin
        .from("journeys")
        .delete()
        .in("id", journeyIds);
      if (jErr) throw new Error(jErr.message);
    }

    // Clean up user-scoped tables
    const { error: pErr } = await supabaseAdmin
      .from("payments")
      .delete()
      .eq("user_id", userId);
    if (pErr) throw new Error(pErr.message);

    const { error: prefsErr } = await supabaseAdmin
      .from("user_preferences")
      .delete()
      .eq("user_id", userId);
    if (prefsErr) throw new Error(prefsErr.message);

    const { error: aErr } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("user_id", userId);
    if (aErr) throw new Error(aErr.message);

    // Clean up phone-scoped logs if we know the phone
    const phone = profile?.phone as string | undefined;
    if (phone) {
      await supabaseAdmin.from("sms_log").delete().eq("phone", phone);
      await supabaseAdmin.from("phone_otps").delete().eq("phone", phone);
    }

    // Finally remove the public profile and auth user
    const { error: uErr } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);
    if (uErr) throw new Error(uErr.message);

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) throw new Error(authErr.message);

    return { ok: true as const };
  });
