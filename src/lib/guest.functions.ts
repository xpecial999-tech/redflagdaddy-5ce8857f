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
