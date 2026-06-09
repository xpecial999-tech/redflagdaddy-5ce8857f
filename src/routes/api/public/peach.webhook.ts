import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/peach/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PEACH_WEBHOOK_SECRET;
        const headerSecret = request.headers.get("x-webhook-secret") ?? request.headers.get("authorization") ?? "";
        if (!secret || !headerSecret.includes(secret)) {
          return new Response("Unauthorized", { status: 401 });
        }
        let payload: Record<string, unknown> = {};
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        const payment = (payload.payment ?? payload) as Record<string, unknown>;
        const checkoutId = (payment.id ?? payment.checkoutId) as string | undefined;
        const result = (payment.result ?? {}) as { code?: string };
        const merchantCustomerId =
          ((payment.customer ?? {}) as { merchantCustomerId?: string }).merchantCustomerId;
        const ok = /^(000\.000\.|000\.100\.1)/.test(result.code ?? "");
        if (!checkoutId) return new Response("missing id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("payments")
          .update({
            status: ok ? "paid" : "failed",
            raw: payload as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("provider", "peach")
          .eq("provider_ref", checkoutId);

        if (ok && merchantCustomerId) {
          await supabaseAdmin
            .from("users")
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq("id", merchantCustomerId);
        }
        return new Response("ok");
      },
    },
  },
});
