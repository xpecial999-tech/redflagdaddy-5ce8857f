import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateInviteCode } from "./utils.server";
import { isValidE164, toE164 } from "./phone";
import { ALL_ROLES } from "./roles";

const CreateGuestSchema = z
  .object({
    guestPhone: z.string().trim().max(24).optional().default(""),
    notificationMode: z.enum(["sms", "owner_code"]).default("sms"),
    partnerType: z.enum(ALL_ROLES),
    isSelf: z.boolean().optional(),
  })
  .transform((data) => {
    if (data.notificationMode === "owner_code") {
      return { ...data, guestPhone: null };
    }
    const normalized = toE164(data.guestPhone);
    if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
    return { ...data, guestPhone: normalized };
  });

export const createGuestJourney = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateGuestSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertJourneyCreationAllowed } = await import("./construction-mode.server");
    await assertJourneyCreationAllowed();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits(
      data.notificationMode === "owner_code"
        ? [
            {
              action: "anonymous_journey_ip",
              value: callerIp(),
              windowSeconds: 24 * 60 * 60,
              maxEvents: 3,
            },
          ]
        : [
            { action: "guest_journey_ip", value: callerIp(), windowSeconds: 60 * 60, maxEvents: 5 },
            {
              action: "guest_journey_phone",
              value: data.guestPhone,
              windowSeconds: 24 * 60 * 60,
              maxEvents: 3,
            },
          ],
    );
    const code = generateInviteCode();
    const ownerCode =
      data.notificationMode === "owner_code"
        ? (await import("./anonymous-owner-code.server")).generateOwnerCode()
        : null;
    const ownerCodeHash = ownerCode
      ? await (await import("./anonymous-owner-code.server")).hashOwnerCode(ownerCode)
      : null;
    const ownerExpiresAt = ownerCode
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .insert({
        creator_id: null,
        title: data.isSelf ? "Self-assessment" : "Guest assessment",
        participant_type: data.partnerType,
        invite_code: code,
        guest_phone: data.guestPhone,
        anonymous_no_contact: data.notificationMode === "owner_code",
        anonymous_owner_code_hash: ownerCodeHash,
        anonymous_owner_expires_at: ownerExpiresAt,
        status: "pending",
      })
      .select("id, invite_code")
      .single();
    if (error) throw new Error(error.message);

    const { error: iErr } = await supabaseAdmin.from("invites").insert({
      journey_id: journey.id,
      code,
    });
    if (iErr) {
      await supabaseAdmin.from("journeys").delete().eq("id", journey.id);
      throw new Error(iErr.message);
    }

    return { code, ownerCode, ownerExpiresAt };
  });

const OwnerCodeSchema = z.object({ ownerCode: z.string().trim().min(1).max(64) });

export const lookupAnonymousJourney = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OwnerCodeSchema.parse(d))
  .handler(async ({ data }) => {
    const { isValidOwnerCode, hashOwnerCode } = await import("./anonymous-owner-code.server");
    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    const validShape = isValidOwnerCode(data.ownerCode);
    const codeHash = await hashOwnerCode(data.ownerCode);

    await consumeRateLimits([
      { action: "anonymous_lookup_ip", value: callerIp(), windowSeconds: 60 * 60, maxEvents: 20 },
      { action: "anonymous_lookup_code", value: codeHash, windowSeconds: 60 * 60, maxEvents: 8 },
    ]);

    if (!validShape) return { status: "unavailable" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .select("id, title, participant_type, status, anonymous_owner_expires_at")
      .eq("anonymous_owner_code_hash", codeHash)
      .eq("anonymous_no_contact", true)
      .maybeSingle();
    if (error) throw new Error("Could not check this code. Please try again.");
    if (!journey) return { status: "unavailable" as const };

    if (
      !journey.anonymous_owner_expires_at ||
      new Date(journey.anonymous_owner_expires_at) <= new Date()
    ) {
      await supabaseAdmin.from("journeys").delete().eq("id", journey.id);
      return { status: "unavailable" as const };
    }

    const { data: result } = await supabaseAdmin
      .from("results")
      .select(
        "safety_score, compatibility_score, red_flag_score, green_flag_score, experience_score, ai_summary",
      )
      .eq("journey_id", journey.id)
      .maybeSingle();

    if (!result) {
      return {
        status: journey.status === "pending" ? ("waiting" as const) : ("in_progress" as const),
        expiresAt: journey.anonymous_owner_expires_at,
      };
    }

    let analysis: import("./analysis.functions").AnalysisPayload | null = null;
    if (result.ai_summary) {
      try {
        analysis = JSON.parse(
          result.ai_summary as string,
        ) as import("./analysis.functions").AnalysisPayload;
      } catch {
        analysis = null;
      }
    }

    return {
      status: "completed" as const,
      expiresAt: journey.anonymous_owner_expires_at,
      journey: { title: journey.title, participantType: journey.participant_type },
      scores: {
        safety: Number(result.safety_score ?? 0),
        compatibility: Number(result.compatibility_score ?? 0),
        red: Number(result.red_flag_score ?? 0),
        green: Number(result.green_flag_score ?? 0),
        experience: Number(result.experience_score ?? 0),
      },
      analysis,
    };
  });

const SendGuestInviteSchema = z.object({
  code: z.string().trim().min(4).max(24),
  recipientName: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  recipientPhone: z
    .string()
    .trim()
    .max(24)
    .transform((v) => {
      const normalized = toE164(v);
      if (!isValidE164(normalized))
        throw new Error("Enter a valid mobile number with country code.");
      return normalized;
    }),
});

export const sendGuestInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SendGuestInviteSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildInviteSms } = await import("./invite-message");
    const { sendClickatellSms } = await import("./phone-auth.server");

    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .select("id, title, invite_code, invite_url, creator_id")
      .eq("invite_code", data.code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!journey || journey.creator_id !== null) throw new Error("Invite not found");

    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits([
      { action: "guest_invite_ip", value: callerIp(), windowSeconds: 60 * 60, maxEvents: 5 },
      { action: "guest_invite_code", value: data.code, windowSeconds: 60 * 60, maxEvents: 3 },
      {
        action: "guest_invite_phone",
        value: data.recipientPhone,
        windowSeconds: 24 * 60 * 60,
        maxEvents: 5,
      },
    ]);

    const origin = process.env["PUBLIC_SITE_URL"] ?? "https://redflagdaddy.com";
    const url = journey.invite_url ?? `${origin}/j/${journey.invite_code}`;

    await sendClickatellSms(
      data.recipientPhone,
      buildInviteSms({
        recipientName: data.recipientName,
        senderName: null,
        title: journey.title,
        notes: data.notes,
        url,
      }),
      "journey-invite",
    );

    return { ok: true as const };
  });
