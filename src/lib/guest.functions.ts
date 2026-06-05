import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CreateGuestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  participantType: z.enum(["Dominant", "submissive", "switch"]),
  guestEmail: z.string().trim().email().max(255),
});

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

export const createGuestJourney = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateGuestSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = generateInviteCode();

    const { data: journey, error } = await supabaseAdmin
      .from("journeys")
      .insert({
        creator_id: null,
        title: data.title,
        participant_type: data.participantType,
        invite_code: code,
        recipient_email: null,
        guest_email: data.guestEmail,
        status: "pending",
      })
      .select("id, invite_code")
      .single();
    if (error) throw new Error(error.message);

    const { error: iErr } = await supabaseAdmin.from("invites").insert({
      journey_id: journey.id,
      code,
      email: data.guestEmail,
    });
    if (iErr) throw new Error(iErr.message);

    return { code };
  });
