import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DELETE_FAILURE_MESSAGE,
  EXPORT_FAILURE_MESSAGE,
  INVITE_EXPORT_FIELDS,
  JOURNEY_EXPORT_FIELDS,
  PAYMENT_EXPORT_FIELDS,
  PREFERENCES_EXPORT_FIELDS,
  PROFILE_EXPORT_FIELDS,
  requirePrivacyResult,
  RESULT_EXPORT_FIELDS,
  smsLogPhone,
} from "@/lib/privacy-lifecycle";

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, prefsRes, journeysRes, paymentsRes] = await Promise.all([
      supabase
        .from("users")
        .select(PROFILE_EXPORT_FIELDS)
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select(PREFERENCES_EXPORT_FIELDS)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("journeys")
        .select(JOURNEY_EXPORT_FIELDS)
        .eq("creator_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select(PAYMENT_EXPORT_FIELDS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const profile = requirePrivacyResult(
      profileRes,
      "load profile for export",
      EXPORT_FAILURE_MESSAGE,
    );
    const preferences = requirePrivacyResult(
      prefsRes,
      "load preferences for export",
      EXPORT_FAILURE_MESSAGE,
    );
    const journeys =
      requirePrivacyResult(
        journeysRes,
        "load journeys for export",
        EXPORT_FAILURE_MESSAGE,
      ) ?? [];
    const payments =
      requirePrivacyResult(
        paymentsRes,
        "load payments for export",
        EXPORT_FAILURE_MESSAGE,
      ) ?? [];
    const journeyIds = journeys.map((j) => j.id);

    let results: unknown[] = [];
    let invites: unknown[] = [];

    if (journeyIds.length > 0) {
      const [resRes, iRes] = await Promise.all([
        supabase
          .from("results")
          .select(RESULT_EXPORT_FIELDS)
          .in("journey_id", journeyIds),
        supabase
          .from("invites")
          .select(INVITE_EXPORT_FIELDS)
          .in("journey_id", journeyIds),
      ]);
      results =
        requirePrivacyResult(
          resRes,
          "load results for export",
          EXPORT_FAILURE_MESSAGE,
        ) ?? [];
      invites =
        requirePrivacyResult(
          iRes,
          "load invites for export",
          EXPORT_FAILURE_MESSAGE,
        ) ?? [];
    }

    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      exportNotes: [
        "Active invite codes, public share tokens, raw payment-provider payloads and authentication secrets are excluded.",
        "Partner-submitted raw assessment answers are excluded from the account owner's export.",
      ],
      profile: profile ?? null,
      preferences: preferences ?? null,
      journeys,
      invites,
      results,
      payments,
    };

    return { json: JSON.stringify(payload, null, 2) };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull profile so we can clean up phone-scoped logs if possible
    const profileResult = await supabaseAdmin
      .from("users")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();
    const profile = requirePrivacyResult(
      profileResult,
      "load profile for deletion",
      DELETE_FAILURE_MESSAGE,
    );

    // Collect all journeys owned by this user
    const journeysResult = await supabaseAdmin
      .from("journeys")
      .select("id")
      .eq("creator_id", userId);
    const journeys =
      requirePrivacyResult(
        journeysResult,
        "load journeys for deletion",
        DELETE_FAILURE_MESSAGE,
      ) ?? [];
    const journeyIds = (journeys ?? []).map((j) => j.id);

    // Clean up journey-related data first
    if (journeyIds.length > 0) {
      const { error: rErr } = await supabaseAdmin
        .from("responses")
        .delete()
        .in("journey_id", journeyIds);
      requirePrivacyResult(
        { data: null, error: rErr },
        "delete responses",
        DELETE_FAILURE_MESSAGE,
      );

      const { error: resErr } = await supabaseAdmin
        .from("results")
        .delete()
        .in("journey_id", journeyIds);
      requirePrivacyResult(
        { data: null, error: resErr },
        "delete results",
        DELETE_FAILURE_MESSAGE,
      );

      const { error: iErr } = await supabaseAdmin
        .from("invites")
        .delete()
        .in("journey_id", journeyIds);
      requirePrivacyResult(
        { data: null, error: iErr },
        "delete invites",
        DELETE_FAILURE_MESSAGE,
      );

      const { error: jErr } = await supabaseAdmin
        .from("journeys")
        .delete()
        .in("id", journeyIds);
      requirePrivacyResult(
        { data: null, error: jErr },
        "delete journeys",
        DELETE_FAILURE_MESSAGE,
      );
    }

    // Clean up user-scoped tables
    const { error: pErr } = await supabaseAdmin
      .from("payments")
      .delete()
      .eq("user_id", userId);
    requirePrivacyResult(
      { data: null, error: pErr },
      "delete payments",
      DELETE_FAILURE_MESSAGE,
    );

    const { error: prefsErr } = await supabaseAdmin
      .from("user_preferences")
      .delete()
      .eq("user_id", userId);
    requirePrivacyResult(
      { data: null, error: prefsErr },
      "delete preferences",
      DELETE_FAILURE_MESSAGE,
    );

    const { error: aErr } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("user_id", userId);
    requirePrivacyResult(
      { data: null, error: aErr },
      "delete admin membership",
      DELETE_FAILURE_MESSAGE,
    );

    // Clean up phone-scoped logs if we know the phone
    const phone = profile?.phone as string | undefined;
    if (phone) {
      const { error: smsError } = await supabaseAdmin
        .from("sms_log")
        .delete()
        .eq("phone", smsLogPhone(phone));
      requirePrivacyResult(
        { data: null, error: smsError },
        "delete SMS delivery logs",
        DELETE_FAILURE_MESSAGE,
      );

      const { error: otpError } = await supabaseAdmin
        .from("phone_otps")
        .delete()
        .eq("phone", phone);
      requirePrivacyResult(
        { data: null, error: otpError },
        "delete phone verification records",
        DELETE_FAILURE_MESSAGE,
      );
    }

    // Delete Auth last. The users profile has an ON DELETE CASCADE relationship,
    // so a failed Auth deletion leaves the profile available for a safe retry
    // rather than creating an orphaned identity with no application profile.
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    requirePrivacyResult(
      { data: null, error: authErr },
      "delete authentication account",
      DELETE_FAILURE_MESSAGE,
    );

    return { ok: true as const };
  });
