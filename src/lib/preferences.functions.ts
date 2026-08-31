import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PreferencesSchema = z.object({
  email_invite_accepted: z.boolean(),
  email_journey_complete: z.boolean(),
  email_red_flag: z.boolean(),
  email_weekly_digest: z.boolean(),
  in_app_messages: z.boolean(),
  in_app_mentions: z.boolean(),
  share_results_with_respondents: z.boolean(),
  anonymous_analytics: z.boolean(),
  discoverable_profile: z.boolean(),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

const DEFAULTS: Preferences = {
  email_invite_accepted: true,
  email_journey_complete: true,
  email_red_flag: true,
  email_weekly_digest: false,
  in_app_messages: true,
  in_app_mentions: true,
  share_results_with_respondents: true,
  anonymous_analytics: false,
  discoverable_profile: false,
};

export const getPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { preferences: DEFAULTS };

    const { user_id: _u, created_at: _c, updated_at: _ut, ...prefs } = data;
    return { preferences: prefs as Preferences };
  });

const UpdateSchema = PreferencesSchema.partial();

export const updatePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, ...DEFAULTS, ...data },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
