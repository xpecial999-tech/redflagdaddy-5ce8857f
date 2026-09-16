import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function runtimeOrigin(): string {
  const env = (
    globalThis as typeof globalThis & {
      __env__?: Record<string, unknown>;
    }
  ).__env__;
  const fromEnv = env?.SITE_URL ?? env?.APP_URL ?? process.env["SITE_URL"] ?? process.env["APP_URL"];
  return typeof fromEnv === "string" && fromEnv.trim()
    ? fromEnv.trim().replace(/\/$/, "")
    : "https://redflagdaddy.com";
}

export const queueWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email =
      typeof claims.email === "string" && claims.email.includes("@")
        ? claims.email.trim().toLowerCase()
        : null;

    if (!email) return { ok: false as const, reason: "no_email" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("email_send_log")
      .select("id")
      .eq("template_name", "welcome")
      .eq("recipient_email", email)
      .in("status", ["pending", "sent", "suppressed"])
      .maybeSingle();

    if (lookupError) {
      console.error("[welcome-email] send-log lookup failed", { userId, code: lookupError.code });
      return { ok: false as const, reason: "lookup_failed" as const };
    }

    if (existing) return { ok: true as const, skipped: true as const };

    const { sendAppEmail } = await import("./email/queue.server");
    const result = await sendAppEmail({
      templateName: "welcome",
      to: email,
      idempotencyKey: `welcome:${userId}`,
      templateData: {
        dashboardUrl: `${runtimeOrigin()}/dashboard`,
      },
    });

    if (!result.ok) {
      console.error("[welcome-email] could not queue", { userId, reason: result.reason });
      return { ok: false as const, reason: result.reason ?? "queue_failed" };
    }

    return { ok: true as const };
  });
