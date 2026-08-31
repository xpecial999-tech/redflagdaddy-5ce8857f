import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { throwPublicDataError } from "./public-data-error";

const CodeSchema = z.object({
  code: z.string().trim().min(4).max(64),
});

function normalizeCode(raw: string) {
  return raw.trim();
}

export const validateInvite = createServerFn({ method: "POST" })
  .validator((data: unknown) => CodeSchema.parse(data))
  .handler(async ({ data }) => {
    const code = normalizeCode(data.code);
    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits([
      {
        action: "invite_validate_ip",
        value: callerIp(),
        windowSeconds: 60 * 60,
        maxEvents: 60,
      },
    ]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up the journey by invite_code (primary) — fall back to invites table by code.
    const { data: journey, error: jErr } = await supabaseAdmin
      .from("journeys")
      .select("id, title, participant_type, status, invite_code, created_at")
      .eq("invite_code", code)
      .maybeSingle();

    if (jErr) throwPublicDataError(jErr, "validate invite journey");
    if (!journey) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const { data: invite, error: iErr } = await supabaseAdmin
      .from("invites")
      .select("id, expires_at, completed_at")
      .eq("journey_id", journey.id)
      .eq("code", code)
      .maybeSingle();

    if (iErr) throwPublicDataError(iErr, "validate invite record");
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
  .validator((data: unknown) => CodeSchema.parse(data))
  .handler(async ({ data }) => {
    const code = normalizeCode(data.code);
    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits([
      {
        action: "invite_start_ip",
        value: callerIp(),
        windowSeconds: 60 * 60,
        maxEvents: 30,
      },
    ]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: journey, error: jErr } = await supabaseAdmin
      .from("journeys")
      .select("id, status")
      .eq("invite_code", code)
      .maybeSingle();
    if (jErr) throwPublicDataError(jErr, "start invite journey");
    if (!journey) throw new Error("Invite not found");

    const { data: invite, error: iErr } = await supabaseAdmin
      .from("invites")
      .select("id, expires_at, completed_at")
      .eq("journey_id", journey.id)
      .eq("code", code)
      .maybeSingle();
    if (iErr) throwPublicDataError(iErr, "start invite record");
    if (!invite) throw new Error("Invite not found");
    if (invite.completed_at) throw new Error("This invite has already been completed.");
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error("This invite has expired.");
    }

    if (journey.status === "pending") {
      const { error: updateError } = await supabaseAdmin
        .from("journeys")
        .update({ status: "in_progress" })
        .eq("id", journey.id);
      if (updateError) throwPublicDataError(updateError, "start invite");
    }

    return { ok: true as const, journeyId: journey.id };
  });
