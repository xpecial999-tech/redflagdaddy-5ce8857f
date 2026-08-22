import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { peachPaymentStatus } from "@/lib/payments.shared";

const PEACH_BASE = process.env.PEACH_BASE_URL ?? "https://eu-test.oppwa.com";

function peachConfig() {
  const entityId = process.env.PEACH_ENTITY_ID;
  const token = process.env.PEACH_ACCESS_TOKEN;
  if (!entityId || !token)
    throw new Error("Peach Payments not configured. Set PEACH_ENTITY_ID and PEACH_ACCESS_TOKEN.");
  return { entityId, token };
}

export const startPeachCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { entityId, token } = peachConfig();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: settings }, { data: user }] = await Promise.all([
      supabaseAdmin
        .from("app_settings")
        .select("paid_mode_enabled, price_cents, currency")
        .eq("id", true)
        .maybeSingle(),
      supabaseAdmin.from("users").select("is_paid").eq("id", context.userId).maybeSingle(),
    ]);
    if (!settings?.paid_mode_enabled) {
      throw new Error("Checkout is unavailable while full access is included.");
    }
    if (user?.is_paid) throw new Error("Your account already has full access.");

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
    const json = (await resp.json()) as {
      id?: string;
      result?: { code?: string; description?: string };
    };
    if (!resp.ok || !json.id) {
      throw new Error(`Peach checkout failed: ${json.result?.description ?? resp.statusText}`);
    }

    const { error: paymentInsertError } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "peach",
      provider_ref: json.id,
      amount_cents: cents,
      currency,
      status: "pending",
      raw: json as never,
    });
    if (paymentInsertError) {
      throw new Error("Checkout started, but its ownership record could not be saved.");
    }

    return {
      checkoutId: json.id,
      scriptUrl: `${PEACH_BASE}/v1/paymentWidgets.js?checkoutId=${json.id}`,
    };
  });

export const finalizePeachPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ checkoutId: z.string().min(8).max(128) }).parse(d))
  .handler(async ({ data, context }) => {
    const { entityId, token } = peachConfig();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment, error: paymentLookupError } = await supabaseAdmin
      .from("payments")
      .select("id, status, amount_cents, currency")
      .eq("provider", "peach")
      .eq("provider_ref", data.checkoutId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (paymentLookupError) throw new Error("Could not verify checkout ownership.");
    if (!payment) throw new Error("This checkout does not belong to your account.");
    if (payment.status === "paid") {
      return { ok: true, code: "already_paid", description: "Payment already confirmed." };
    }

    const url = `${PEACH_BASE}/v1/checkouts/${encodeURIComponent(data.checkoutId)}/payment?entityId=${encodeURIComponent(entityId)}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = (await resp.json()) as {
      amount?: string;
      currency?: string;
      result?: { code?: string; description?: string };
      id?: string;
    };
    const code = json.result?.code ?? "";
    const expectedAmount = (payment.amount_cents / 100).toFixed(2);
    const amountMatches = !json.amount || Number(json.amount).toFixed(2) === expectedAmount;
    const currencyMatches =
      !json.currency || json.currency.toUpperCase() === payment.currency.toUpperCase();
    const status = resp.ok ? peachPaymentStatus(code, amountMatches && currencyMatches) : "failed";
    const ok = status === "paid";

    const { error: paymentUpdateError } = await supabaseAdmin
      .from("payments")
      .update({
        status,
        raw: json as never,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);
    if (paymentUpdateError) throw new Error("Could not save the verified payment status.");

    if (ok) {
      const { error: entitlementError } = await supabaseAdmin
        .from("users")
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq("id", context.userId);
      if (entitlementError) throw new Error("Payment verified, but access could not be unlocked.");
    }

    return { ok, code, description: json.result?.description ?? "" };
  });
