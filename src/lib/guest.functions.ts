import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateInviteCode } from "./utils.server";
import { isValidE164, toE164 } from "./phone";
import { ALL_ROLES } from "./roles";

const CreateGuestSchema = z.object({
  guestPhone: z
    .string()
    .trim()
    .max(24)
    .transform((v) => {
      if (!v) throw new Error("Mobile number is required.");
      const normalized = toE164(v);
      if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
      return normalized;
    }),
  partnerType: z.enum(ALL_ROLES),
  isSelf: z.boolean().optional(),
});

export const createGuestJourney = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateGuestSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits([
      { action: "guest_journey_ip", value: callerIp(), windowSeconds: 60 * 60, maxEvents: 5 },
      { action: "guest_journey_phone", value: data.guestPhone, windowSeconds: 24 * 60 * 60, maxEvents: 3 },
    ]);
    const code = generateInviteCode();
    const guestPhone = data.guestPhone && data.guestPhone.length > 0 ? data.guestPhone : null;

    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .insert({
        creator_id: null,
        title: data.isSelf ? "Self-assessment" : "Guest assessment",
        participant_type: data.partnerType,
        invite_code: code,
        guest_phone: guestPhone,
        status: "pending",
      })
      .select("id, invite_code")
      .single();
    if (error) throw new Error(error.message);


    const { error: iErr } = await supabaseAdmin.from("invites").insert({
      journey_id: journey.id,
      code,
    });
    if (iErr) throw new Error(iErr.message);


    return { code };
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
      if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
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
      { action: "guest_invite_phone", value: data.recipientPhone, windowSeconds: 24 * 60 * 60, maxEvents: 5 },
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
