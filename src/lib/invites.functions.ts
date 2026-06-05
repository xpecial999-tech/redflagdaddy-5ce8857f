import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CodeSchema = z.object({
  code: z.string().trim().min(4).max(64),
});

function normalizeCode(raw: string) {
  return raw.trim();
}

export const validateInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CodeSchema.parse(data))
  .handler(async ({ data }) => {
    const code = normalizeCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up the journey by invite_code (primary) — fall back to invites table by code.
    const { data: journey, error: jErr } = await supabaseAdmin
      .from("journeys")
      .select("id, title, participant_type, status, invite_code, created_at")
      .eq("invite_code", code)
      .maybeSingle();

    if (jErr) throw new Error(jErr.message);
    if (!journey) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const { data: invite, error: iErr } = await supabaseAdmin
      .from("invites")
      .select("id, expires_at, completed_at")
      .eq("journey_id", journey.id)
      .eq("code", code)
      .maybeSingle();

    if (iErr) throw new Error(iErr.message);
    if (!invite) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const now = Date.now();
    if (invite.completed_at) {
      return { ok: false as const, reason: "completed" as const };
    }
    if (invite.expires_at && new Date(invite.expires_at).getTime() < now) {
      return { ok: false as const, reason: "expired" as const };
    }
    if (journey.status === "expired" || journey.status === "completed") {
      return { ok: false as const, reason: journey.status as "expired" | "completed" };
    }

    // ~25 questions * 20s average + reflection
    const estimatedMinutes = 12;

    return {
      ok: true as const,
      journey: {
        id: journey.id,
        title: journey.title,
        participantType: journey.participant_type,
        status: journey.status,
      },
      invite: {
        id: invite.id,
        expiresAt: invite.expires_at,
      },
      estimatedMinutes,
    };
  });

export const startInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CodeSchema.parse(data))
  .handler(async ({ data }) => {
    const code = normalizeCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: journey, error: jErr } = await supabaseAdmin
      .from("journeys")
      .select("id, status")
      .eq("invite_code", code)
      .maybeSingle();
    if (jErr) throw new Error(jErr.message);
    if (!journey) throw new Error("Invite not found");

    const { data: invite, error: iErr } = await supabaseAdmin
      .from("invites")
      .select("id, expires_at, completed_at")
      .eq("journey_id", journey.id)
      .eq("code", code)
      .maybeSingle();
    if (iErr) throw new Error(iErr.message);
    if (!invite) throw new Error("Invite not found");
    if (invite.completed_at) throw new Error("This invite has already been completed.");
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error("This invite has expired.");
    }

    if (journey.status === "pending") {
      await supabaseAdmin
        .from("journeys")
        .update({ status: "in_progress" })
        .eq("id", journey.id);
    }

    return { ok: true as const, journeyId: journey.id };
  });
