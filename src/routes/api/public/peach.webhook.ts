import { createFileRoute } from "@tanstack/react-router";
import { peachPaymentStatus, verifyPeachWebhookSignature } from "@/lib/payments.shared";

export const Route = createFileRoute("/api/public/peach/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { paymentsActivationEnabled } = await import("@/lib/payment-config.server");
        if (!paymentsActivationEnabled()) return new Response("Not found", { status: 404 });
        const secret = process.env.PEACH_WEBHOOK_SECRET ?? "";
        const rawBody = await request.text();
        const signatureValid = await verifyPeachWebhookSignature({
          secret,
          timestamp: request.headers.get("x-webhook-timestamp") ?? "",
          webhookId: request.headers.get("x-webhook-id") ?? "",
          url: request.url,
          rawBody,
          receivedSignature: request.headers.get("x-webhook-signature") ?? "",
        });
        if (!signatureValid) return new Response("Unauthorized", { status: 401 });

        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.includes("application/x-www-form-urlencoded")) {
          // Peach's initial configuration webhook is JSON and has no payment to reconcile.
          return new Response("ignored");
        }

        const payload = new URLSearchParams(rawBody);
        const checkoutId = payload.get("checkoutId");
        const code = payload.get("result.code") ?? payload.get("result_code") ?? "";
        if (!checkoutId) return new Response("Missing checkoutId", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment, error: paymentLookupError } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, amount_cents, currency, status")
          .eq("provider", "peach")
          .eq("provider_ref", checkoutId)
          .maybeSingle();
        if (paymentLookupError) return new Response("Payment lookup failed", { status: 500 });
        if (!payment) return new Response("Unknown checkout", { status: 404 });

        const receivedAmount = payload.get("amount");
        const receivedCurrency = payload.get("currency");
        const amountMatches =
          !receivedAmount ||
          Number(receivedAmount).toFixed(2) === (payment.amount_cents / 100).toFixed(2);
        const currencyMatches =
          !receivedCurrency || receivedCurrency.toUpperCase() === payment.currency.toUpperCase();
        const status = peachPaymentStatus(code, amountMatches && currencyMatches);
        const ok = status === "paid";

        // Webhooks can arrive out of order. Never let an older non-success event
        // downgrade a payment that has already been confirmed.
        if (payment.status === "paid" && !ok) return new Response("ignored");

        const raw = Object.fromEntries(payload.entries());
        const { error: paymentUpdateError } = await supabaseAdmin
          .from("payments")
          .update({
            status,
            raw: raw as never,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);
        if (paymentUpdateError) return new Response("Payment update failed", { status: 500 });

        if (ok) {
          const { error: entitlementError } = await supabaseAdmin
            .from("users")
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq("id", payment.user_id);
          if (entitlementError) {
            return new Response("Entitlement update failed", { status: 500 });
          }
        }

        return new Response("ok");
      },
    },
  },
});
