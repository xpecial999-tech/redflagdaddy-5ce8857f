import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PEACH_BASE = process.env.PEACH_BASE_URL ?? "https://eu-test.oppwa.com";

function peachConfig() {
  const entityId = process.env.PEACH_ENTITY_ID;
  const token = process.env.PEACH_ACCESS_TOKEN;
  if (!entityId || !token) throw new Error("Peach Payments not configured. Set PEACH_ENTITY_ID and PEACH_ACCESS_TOKEN.");
  return { entityId, token };
}

export const startPeachCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { entityId, token } = peachConfig();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Read price
    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("price_cents, currency")
      .eq("id", true)
      .maybeSingle();
    const cents = settings?.price_cents ?? 100;
    const currency = settings?.currency ?? "USD";
    const amount = (cents / 100).toFixed(2);

    const body = new URLSearchParams({
      entityId,
      amount,
      currency,
      paymentType: "DB",
      "customer.merchantCustomerId": context.userId,
      merchantTransactionId: `rfd-${context.userId}-${Date.now()}`,
    });

    const resp = await fetch(`${PEACH_BASE}/v1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const json = (await resp.json()) as { id?: string; result?: { code?: string; description?: string } };
    if (!resp.ok || !json.id) {
      throw new Error(`Peach checkout failed: ${json.result?.description ?? resp.statusText}`);
    }

    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "peach",
      provider_ref: json.id,
      amount_cents: cents,
      currency,
      status: "pending",
      raw: json as never,
    });

    return { checkoutId: json.id, scriptUrl: `${PEACH_BASE}/v1/paymentWidgets.js?checkoutId=${json.id}` };
  });

export const finalizePeachPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ checkoutId: z.string().min(8).max(128) }).parse(d))
  .handler(async ({ data, context }) => {
    const { entityId, token } = peachConfig();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const url = `${PEACH_BASE}/v1/checkouts/${encodeURIComponent(data.checkoutId)}/payment?entityId=${encodeURIComponent(entityId)}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = (await resp.json()) as { result?: { code?: string; description?: string }; id?: string };
    const code = json.result?.code ?? "";
    // Peach success codes: 000.000.000, 000.000.100, 000.100.110, 000.100.111, 000.100.112
    const ok = /^(000\.000\.|000\.100\.1)/.test(code);

    await supabaseAdmin
      .from("payments")
      .update({
        status: ok ? "paid" : "failed",
        raw: json as never,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", "peach")
      .eq("provider_ref", data.checkoutId)
      .eq("user_id", context.userId);

    if (ok) {
      await supabaseAdmin
        .from("users")
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq("id", context.userId);
    }

    return { ok, code, description: json.result?.description ?? "" };
  });
