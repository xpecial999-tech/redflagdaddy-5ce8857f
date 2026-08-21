import { createFileRoute } from "@tanstack/react-router";

/**
 * Clickatell delivery-status (DLR) callback.
 * Configure this URL in the Clickatell portal as the status callback:
 *   https://redflagdaddy.com/api/public/sms/status
 * It records the final carrier status against the sms_log row.
 */
export const Route = createFileRoute("/api/public/sms/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          console.error("[sms-status] Invalid payload:", raw.slice(0, 300));
          return new Response("bad payload", { status: 400 });
        }

        const events = Array.isArray(payload) ? payload : (payload.statuses ?? payload.messages ?? [payload]);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        for (const ev of events) {
          const id = ev?.apiMessageId ?? ev?.messageId ?? ev?.integrationId;
          const status = String(ev?.statusDescription ?? ev?.status ?? "unknown");
          if (!id) continue;
          console.log(`[sms-status] ${id} -> ${status}`);
          await (supabaseAdmin.from("sms_log") as any)
            .update({ status, error: ev?.errorDescription ?? null, updated_at: new Date().toISOString() })
            .eq("provider_message_id", id);
        }

        return new Response("ok");
      },
    },
  },
});
