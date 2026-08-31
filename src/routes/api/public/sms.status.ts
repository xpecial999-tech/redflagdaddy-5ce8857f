import { createFileRoute } from "@tanstack/react-router";
import {
  parseSmsStatusUpdates,
  readBoundedSmsStatusBody,
  SmsStatusCallbackError,
  verifySmsStatusAuthorization,
} from "@/lib/sms-status-callback";

const NO_STORE_HEADERS = { "cache-control": "no-store" };

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
        const authorization = verifySmsStatusAuthorization(
          request.headers.get("authorization"),
          process.env["CLICKATELL_CALLBACK_USERNAME"],
          process.env["CLICKATELL_CALLBACK_PASSWORD"],
        );
        if (authorization === "unconfigured") {
          console.error("[sms-status] Callback credentials are not configured");
          return new Response("unavailable", { status: 503, headers: NO_STORE_HEADERS });
        }
        if (authorization === "unauthorized") {
          console.warn("[sms-status] Rejected an unauthorized callback");
          return new Response("unauthorized", {
            status: 401,
            headers: {
              ...NO_STORE_HEADERS,
              "www-authenticate": 'Basic realm="RedFlagDaddy SMS status"',
            },
          });
        }

        let updates;
        try {
          const raw = await readBoundedSmsStatusBody(request);
          updates = parseSmsStatusUpdates(raw);
        } catch (error) {
          const status = error instanceof SmsStatusCallbackError ? error.status : 400;
          console.warn("[sms-status] Rejected an invalid callback", { status });
          return new Response(status === 413 ? "payload too large" : "bad payload", {
            status,
            headers: NO_STORE_HEADERS,
          });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        for (const update of updates) {
          const { error } = await supabaseAdmin
            .from("sms_log")
            .update({
              status: update.status,
              error: update.error,
              updated_at: new Date().toISOString(),
            })
            .eq("provider_message_id", update.id);
          if (error) {
            console.error("[sms-status] Could not update delivery status", { code: error.code });
            return new Response("temporary failure", { status: 503, headers: NO_STORE_HEADERS });
          }
        }

        return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
      },
    },
  },
});
