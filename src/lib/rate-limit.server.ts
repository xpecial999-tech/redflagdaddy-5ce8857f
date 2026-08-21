import { createHmac } from "crypto";
import { getRequestHeader } from "@tanstack/react-start/server";

type RateLimitRule = {
  action: string;
  value: string | null | undefined;
  windowSeconds: number;
  maxEvents: number;
};

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please wait and try again.");
    this.name = "RateLimitError";
  }
}

export function callerIp(): string | null {
  // Prefer headers set by trusted edge platforms. x-forwarded-for is only a
  // fallback and must be sanitized by the production reverse proxy.
  const trusted = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-real-ip");
  if (trusted) return trusted.trim();
  const forwarded = getRequestHeader("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}

function hashRateLimitKey(value: string): string {
  const secret = process.env["OTP_SECRET"];
  if (!secret) throw new Error("Rate limiting is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function consumeRateLimits(rules: RateLimitRule[]): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  for (const rule of rules) {
    if (!rule.value) continue;
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
      action_name: rule.action,
      hashed_key: hashRateLimitKey(rule.value),
      window_seconds: rule.windowSeconds,
      max_events: rule.maxEvents,
    });
    if (error) {
      console.error("[rate-limit] Check failed", { action: rule.action, code: error.code });
      throw new Error("Could not process this request. Please try again.");
    }
    if (!data) throw new RateLimitError();
  }
}
