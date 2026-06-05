import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateJourneySchema = z.object({
  title: z.string().trim().min(1).max(120),
  participantType: z.enum(["Dominant", "submissive", "switch"]),
  recipientName: z.string().trim().max(120).optional().nullable(),
  recipientEmail: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
});

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

function originFromRequest(): string {
  return process.env.PUBLIC_APP_URL ?? "https://app.dynamiccompass.app";
}

export const createJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateJourneySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = generateInviteCode();
    const origin = originFromRequest();
    const inviteUrl = `${origin}/journey/${code}`;

    const { data: journey, error } = await supabase
      .from("journeys")
      .insert({
        creator_id: userId,
        title: data.title,
        participant_type: data.participantType,
        invite_code: code,
        invite_url: inviteUrl,
        recipient_email: data.recipientEmail || null,
        status: "pending",
      })
      .select("id, title, invite_code, invite_url, recipient_email, status, participant_type, created_at")
      .single();

    if (error) throw new Error(error.message);

    // Create matching invite row (7-day expiry default via schema)
    const { error: inviteErr } = await supabase.from("invites").insert({
      journey_id: journey.id,
      code,
      email: data.recipientEmail || null,
    });
    if (inviteErr) throw new Error(inviteErr.message);

    return {
      journey,
      notes: data.notes ?? null,
      recipientName: data.recipientName ?? null,
    };
  });

export const listJourneys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journeys")
      .select("id, title, invite_code, invite_url, recipient_email, status, participant_type, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { journeys: data ?? [] };
  });
