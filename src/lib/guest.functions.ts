import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateInviteCode } from "./utils.server";
import { isValidE164, toE164 } from "./phone";
import { ALL_ROLES } from "./roles";

const CreateGuestSchema = z.object({
  guestEmail: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("")),
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
  partnerEmail: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("")),
  partnerType: z.enum(ALL_ROLES),
  isSelf: z.boolean().optional(),
});

export const createGuestJourney = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateGuestSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = generateInviteCode();
    const partnerEmail = data.partnerEmail && data.partnerEmail.length > 0 ? data.partnerEmail : null;
    const guestPhone = data.guestPhone && data.guestPhone.length > 0 ? data.guestPhone : null;

    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .insert({
        creator_id: null,
        title: data.isSelf ? "Self-assessment" : "Guest assessment",
        participant_type: data.partnerType,
        invite_code: code,
        recipient_email: partnerEmail,
        guest_email: data.guestEmail || null,
        guest_phone: guestPhone,
        status: "pending",
      })
      .select("id, invite_code")
      .single();
    if (error) throw new Error(error.message);


    const { error: iErr } = await supabaseAdmin.from("invites").insert({
      journey_id: journey.id,
      code,
      email: partnerEmail,
    });
    if (iErr) throw new Error(iErr.message);

    if (partnerEmail) {
      const { sendAppEmail } = await import("./email/queue.server");
      await sendAppEmail({
        templateName: "journey-invite",
        to: partnerEmail,
        idempotencyKey: `journey-invite-${journey.id}`,
        templateData: {
          journeyTitle: data.isSelf ? "Self-assessment" : "Guest assessment",
          inviteUrl: `https://redflagdaddy.com/j/${code}`,
          inviteCode: code,
        },
      });
    }

    return { code, hasPartnerEmail: Boolean(partnerEmail) };
  });
