import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateInviteCode } from "./utils.server";

const CreateJourneySchema = z.object({
  title: z.string().trim().min(1).max(120),
  participantType: z.enum(["Dominant", "submissive", "switch"]),
  recipientName: z.string().trim().max(120).optional().nullable(),
  recipientEmail: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
});

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

const JourneyIdSchema = z.object({ id: z.string().uuid() });

export const getJourneyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => JourneyIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: journey, error } = await supabase
      .from("journeys")
      .select(
        "id, title, invite_code, invite_url, recipient_email, status, participant_type, created_at, updated_at, creator_id",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!journey) throw new Error("Journey not found");
    if (journey.creator_id !== userId) throw new Error("Not authorized");

    const [{ data: invite }, { count: responseCount }, { count: questionCount }] = await Promise.all([
      supabase
        .from("invites")
        .select("id, expires_at, completed_at, created_at")
        .eq("journey_id", journey.id)
        .maybeSingle(),
      supabase
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("journey_id", journey.id),
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("active", true)
        .contains("applies_to", [journey.participant_type]),
    ]);

    const answered = responseCount ?? 0;
    const total = questionCount ?? 0;
    const progress = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;

    const expiresAt = invite?.expires_at ?? null;
    const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;

    return {
      journey,
      invite: invite ?? null,
      progress: { answered, total, percent: progress },
      isExpired,
    };
  });

export const deleteJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => JourneyIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: journey, error: jErr } = await supabase
      .from("journeys")
      .select("id, creator_id")
      .eq("id", data.id)
      .maybeSingle();
    if (jErr) throw new Error(jErr.message);
    if (!journey || journey.creator_id !== userId) throw new Error("Not authorized");
    const { error } = await supabase.from("journeys").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

