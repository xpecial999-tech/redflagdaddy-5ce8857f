import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = "Red Flag Daddy <noreply@redflagdaddy.com>";

const SendEmailSchema = z.object({
  to: z.union([z.string().email().max(255), z.array(z.string().email().max(255)).min(1).max(50)]),
  subject: z.string().min(1).max(255),
  html: z.string().min(1).max(200_000),
  text: z.string().max(200_000).optional(),
  from: z.string().min(3).max(255).optional(),
  replyTo: z.string().email().max(255).optional(),
});

/**
 * Send an email via Resend through the Lovable connector gateway.
 * Requires the Resend connector to be linked (RESEND_API_KEY).
 */
export const sendEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SendEmailSchema.parse(d))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: data.from ?? DEFAULT_FROM,
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text,
        reply_to: data.replyTo,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[resend] send failed", res.status, body);
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }
    return { ok: true as const, id: (body as { id?: string }).id };
  });
