import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateInviteCode } from "./utils.server";

const CreateGuestSchema = z.object({
  guestEmail: z.string().trim().email().max(255),
  partnerEmail: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("")),
  partnerType: z.enum(["Dominant", "submissive", "switch"]),
  isSelf: z.boolean().optional(),
});

export const createGuestJourney = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateGuestSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = generateInviteCode();
    const partnerEmail = data.partnerEmail && data.partnerEmail.length > 0 ? data.partnerEmail : null;

    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .insert({
        creator_id: null,
        title: data.isSelf ? "Self-assessment" : "Guest assessment",
        participant_type: data.partnerType,
        invite_code: code,
        recipient_email: partnerEmail,
        guest_email: data.guestEmail,
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
          inviteUrl: `https://redflagdaddy.com/journey/${code}`,
          inviteCode: code,
        },
      });
    }

    return { code, hasPartnerEmail: Boolean(partnerEmail) };
  });
