import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateInviteCode } from "./utils.server";
import { loadEntitlement, DEFAULT_QUESTION_LIMIT } from "./entitlement.functions";
import { ALL_ROLES } from "./roles";
import { buildInviteSms } from "./invite-message";


const CreateJourneySchema = z.object({
  title: z.string().trim().min(1).max(120),
  participantType: z.enum(ALL_ROLES),
  recipientName: z.string().trim().max(120).optional().nullable(),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid mobile number")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
  categoryIds: z.array(z.string().uuid()).max(30).optional().nullable(),
  questionLimit: z.number().int().min(10).max(500).optional().nullable(),
});

function originFromRequest(): string {
  return process.env.PUBLIC_APP_URL ?? "https://redflagdaddy.com";
}

export const createJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateJourneySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const ent = await loadEntitlement(userId);
    if (!ent.canCreateJourney) {
      throw new Error(
        `Free plan limit reached (${ent.freeJourneyCap} journeys). Upgrade to create more.`,
      );
    }
    // Free users can't use category deep-dive
    const categoryIds = ent.canDeepDive && data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds : null;
    const entLimit = ent.questionLimit ?? DEFAULT_QUESTION_LIMIT;
    const questionLimit = categoryIds
      ? null
      : data.questionLimit
        ? Math.min(data.questionLimit, entLimit)
        : entLimit;

    const code = generateInviteCode();
    const origin = originFromRequest();
    const inviteUrl = `${origin}/j/${code}`;

    const { data: journey, error } = await supabase
      .from("journeys")
      .insert({
        creator_id: userId,
        title: data.title,
        participant_type: data.participantType,
        invite_code: code,
        invite_url: inviteUrl,
        status: "pending",
        category_ids: categoryIds,
        question_limit: questionLimit,
      })
      .select("id, title, invite_code, invite_url, recipient_email, status, participant_type, created_at, category_ids, question_limit")
      .single();

    if (error) throw new Error(error.message);

    const { error: inviteErr } = await supabase.from("invites").insert({
      journey_id: journey.id,
      code,
    });
    if (inviteErr) throw new Error(inviteErr.message);

    let smsSent = false;
    if (data.recipientPhone) {
      try {
        const { sendClickatellSms } = await import("./phone-auth.server");
        const { data: me } = await supabase.from("users").select("name").eq("id", userId).maybeSingle();
        await sendClickatellSms(
          data.recipientPhone,
          buildInviteSms({
            recipientName: data.recipientName,
            senderName: me?.name ?? null,
            title: journey.title,
            notes: data.notes,
            url: inviteUrl,
          }),
          "journey-invite",
        );
        smsSent = true;
      } catch (e) {
        console.error("Invite SMS failed:", e);
      }
    }


    return {
      journey,
      notes: data.notes ?? null,
      recipientName: data.recipientName ?? null,
      smsSent,
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
        "id, title, invite_code, invite_url, recipient_email, status, participant_type, created_at, updated_at, creator_id, category_ids, question_limit",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!journey) throw new Error("Journey not found");
    if (journey.creator_id !== userId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminRow } = await supabaseAdmin
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!adminRow) throw new Error("Not authorized");
    }

    const [{ data: invite }, { count: responseCount }] = await Promise.all([
      supabase
        .from("invites")
        .select("id, expires_at, completed_at, created_at")
        .eq("journey_id", journey.id)
        .maybeSingle(),
      supabase
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("journey_id", journey.id),
    ]);

    // Total questions = limit if set, otherwise count of relevant questions
    let total = journey.question_limit ?? 0;
    if (!total) {
      let q = supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("active", true)
        .contains("applies_to", [journey.participant_type]);
      if (journey.category_ids && journey.category_ids.length > 0) {
        q = q.in("category_id", journey.category_ids);
      }
      const { count } = await q;
      total = count ?? 0;
    }
    const answered = responseCount ?? 0;
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

export const sendJourneyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        channel: z.literal("sms").default("sms"),
        recipientName: z.string().trim().max(120).optional().nullable(),
        notes: z.string().trim().max(500).optional().nullable(),

        recipientPhone: z
          .string()
          .trim()
          .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid mobile number, e.g. +27123456789")
          .optional()
          .nullable()
          .or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: journey, error: jErr } = await supabase
      .from("journeys")
      .select("id, title, invite_url, invite_code, creator_id")
      .eq("id", data.id)
      .maybeSingle();
    if (jErr) throw new Error(jErr.message);
    if (!journey) throw new Error("Journey not found");
    if (journey.creator_id !== userId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: adminRow } = await supabaseAdmin
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!adminRow) throw new Error("Not authorized");
    }

    const inviteUrl = journey.invite_url ?? `${originFromRequest()}/j/${journey.invite_code}`;

      const phone = data.recipientPhone?.trim();
      if (!phone) throw new Error("Enter a valid mobile number.");
      const { sendClickatellSms } = await import("./phone-auth.server");
      const { data: me } = await supabase.from("users").select("name").eq("id", userId).maybeSingle();
      await sendClickatellSms(
        phone,
        buildInviteSms({
          recipientName: data.recipientName,
          senderName: me?.name ?? null,
          title: journey.title,
          notes: data.notes,
          url: inviteUrl,
        }),
        "journey-invite",
      );

      const { error: updErr } = await supabase
        .from("journeys")
        .update({ guest_phone: phone })
        .eq("id", journey.id);
      if (updErr) console.error("Failed to store guest phone:", updErr.message);
    return { ok: true as const, channel: "sms" as const };
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
