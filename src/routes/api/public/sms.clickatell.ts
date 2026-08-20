import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const userSchema = z.object({ phone: z.string().optional() }).passthrough();

const smsPayloadSchema = z
  .object({
    event: z.string().optional(),
    phone: z.string().optional(),
    user: userSchema.optional(),
    code: z.string().optional(),
    otp: z.string().optional(),
    message: z.string().optional(),
    to: z.string().optional(),
  })
  .passthrough();

const CLICKATELL_URL = "https://platform.clickatell.com/v1/message";

export const Route = createFileRoute("/api/public/sms/clickatell")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type, x-webhook-secret, authorization",
          },
        });
      },
      POST: async ({ request }) => {
        const apiKey = process.env["CLICKATELL_API_KEY"];
        if (!apiKey) {
          console.error("[clickatell-sms] CLICKATELL_API_KEY is not configured");
          return new Response("SMS provider not configured", { status: 503 });
        }

        // Optional shared-secret check. If CLICKATELL_WEBHOOK_SECRET is set, the caller
        // must send it in the x-webhook-secret header or as a ?key= query param.
        const webhookSecret = process.env["CLICKATELL_WEBHOOK_SECRET"];
        if (webhookSecret) {
          const url = new URL(request.url);
          const headerSecret = request.headers.get("x-webhook-secret") ?? "";
          const querySecret = url.searchParams.get("key") ?? "";
          if (headerSecret !== webhookSecret && querySecret !== webhookSecret) {
            return new Response("Unauthorized", { status: 401 });
          }
        }

        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }

        const parsed = smsPayloadSchema.safeParse(rawBody);
        if (!parsed.success) {
          console.error("[clickatell-sms] Invalid payload:", parsed.error.flatten());
          return new Response("Invalid payload", { status: 400 });
        }

        const payload = parsed.data;
        const phone = payload.to || payload.phone || payload.user?.phone;
        const code = payload.code || payload.otp;
        const message = payload.message || (code ? `Your RedFlagDaddy code is ${code}.` : undefined);

        if (!phone) {
          return new Response("Missing phone number", { status: 400 });
        }
        if (!message) {
          return new Response("Missing message or OTP code", { status: 400 });
        }

        // Normalise to E.164 digits only for Clickatell.
        const toNumber = phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
        if (!/^\+[1-9]\d{7,14}$/.test(toNumber)) {
          return new Response("Invalid phone number format", { status: 400 });
        }

        try {
          const response = await fetch(CLICKATELL_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: apiKey,
            },
            body: JSON.stringify({
              content: message,
              to: [toNumber],
            }),
          });

          const responseBody = await response.text();

          if (!response.ok) {
            console.error(`[clickatell-sms] Provider error ${response.status}: ${responseBody}`);
            return new Response(`Clickatell error: ${response.status}`, { status: 502 });
          }

          console.log(`[clickatell-sms] Sent to ${toNumber}: ${responseBody}`);
          return new Response("ok", {
            status: 200,
            headers: { "access-control-allow-origin": "*" },
          });
        } catch (err) {
          console.error("[clickatell-sms] Failed to reach Clickatell:", err);
          return new Response("Failed to reach SMS provider", { status: 502 });
        }
      },
    },
  },
});
