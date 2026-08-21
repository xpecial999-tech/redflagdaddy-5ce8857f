import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

const OTP_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const RESEND_COOLDOWN_MS = 60 * 1000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_OTP_REQUESTS_PER_DAY = 8;
const IP_WINDOW_MS = 60 * 60 * 1000;
const MAX_OTP_REQUESTS_PER_IP = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const OTP_EXPIRY_MINUTES = 5;
const CLICKATELL_URL = "https://platform.clickatell.com/v1/message";

/** Generic, non-enumerating copy: never reveals whether an account exists. */
const GENERIC_VERIFY_ERROR = "That code is invalid or has expired. Request a new one.";

export type OtpMetadata = {
  name?: string;
  role?: string;
};

type SupabaseAdminClient = SupabaseClient<Database>;

function hashCode(code: string): string {
  const secret = process.env["OTP_SECRET"];
  if (!secret) throw new Error("OTP_SECRET is not configured");
  return createHmac("sha256", secret).update(code).digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function randomPassword(): string {
  return randomBytes(32).toString("base64");
}

async function getSupabaseAdmin(): Promise<SupabaseAdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as SupabaseAdminClient;
}

function getSupabaseSignInClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend auth is not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

async function logSms(entry: {
  phone: string;
  purpose: string;
  content: string;
  providerMessageId?: string | null;
  status: string;
  error?: string | null;
}) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await (supabaseAdmin.from("sms_log") as any).insert({
      phone: entry.phone,
      purpose: entry.purpose,
      content_preview: entry.content.slice(0, 160),
      provider_message_id: entry.providerMessageId ?? null,
      status: entry.status,
      error: entry.error ?? null,
    });
  } catch (e) {
    console.error("[clickatell-sms] Failed to write sms_log:", e);
  }
}

export async function sendClickatellSms(phone: string, content: string, purpose = "general") {
  const apiKey = process.env["CLICKATELL_API_KEY"];
  if (!apiKey) throw new Error("CLICKATELL_API_KEY is not configured");

  const to = phone.replace(/\D/g, "");
  const response = await fetch(CLICKATELL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      messages: [{ channel: "sms", to, content }],
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`[clickatell-sms] Provider error ${response.status}: ${body}`);
    throw new Error(`Clickatell error: ${response.status}`);
  }

  let parsed: {
    messages?: Array<{
      apiMessageId?: string;
      accepted?: boolean;
      error?: unknown;
      errorCode?: number;
      errorDescription?: string;
    }>;
    error?: unknown;
  };
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    console.error("[clickatell-sms] Invalid provider response");
    throw new Error("Clickatell returned an invalid response");
  }

  const message = parsed.messages?.[0];
  if (!message || message.accepted !== true || !message.apiMessageId) {
    console.error("[clickatell-sms] Message was not accepted:", body);
    throw new Error(message?.errorDescription || "SMS provider did not accept the message");
  }

  console.log(`[clickatell-sms] Accepted message ${message.apiMessageId}`);
}

/** Hash the caller IP so we can rate-limit without storing raw addresses. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const secret = process.env["OTP_SECRET"];
  if (!secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

async function countSince(
  supabaseAdmin: SupabaseAdminClient,
  column: "phone" | "ip_hash",
  value: string,
  windowMs: number,
) {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabaseAdmin
    .from("phone_otps")
    .select("*", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

/** Latest row for a phone, used for cooldown + lockout checks. */
async function latestForPhone(supabaseAdmin: SupabaseAdminClient, phone: string) {
  const { data } = await supabaseAdmin
    .from("phone_otps")
    .select("id, created_at, locked_until")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function requestPhoneOtpHandler(data: { phone: string; ip?: string | null }) {
  const supabaseAdmin = await getSupabaseAdmin();
  const ipHash = hashIp(data.ip);

  const latest = await latestForPhone(supabaseAdmin, data.phone);
  if (latest?.locked_until && new Date(latest.locked_until) > new Date()) {
    return { error: "This number is temporarily locked. Please try again in 15 minutes." };
  }
  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(latest.created_at).getTime())) / 1000);
    return { error: `Please wait ${wait}s before requesting another code.` };
  }

  const [recent, daily, perIp] = await Promise.all([
    countSince(supabaseAdmin, "phone", data.phone, OTP_REQUEST_WINDOW_MS),
    countSince(supabaseAdmin, "phone", data.phone, DAILY_WINDOW_MS),
    ipHash ? countSince(supabaseAdmin, "ip_hash", ipHash, IP_WINDOW_MS) : Promise.resolve(0),
  ]);

  if (recent >= MAX_OTP_REQUESTS_PER_WINDOW) {
    return { error: "Too many code requests. Please wait 10 minutes and try again." };
  }
  if (daily >= MAX_OTP_REQUESTS_PER_DAY) {
    return { error: "Daily code limit reached for this number. Please try again tomorrow." };
  }
  if (perIp >= MAX_OTP_REQUESTS_PER_IP) {
    console.warn("[phone-otp] IP rate limit hit");
    return { error: "Too many code requests from this device. Please try again later." };
  }

  // Only one live code per number: retire any outstanding ones first.
  await supabaseAdmin.from("phone_otps").update({ used: true }).eq("phone", data.phone).eq("used", false);

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const { data: stored, error: insertError } = await supabaseAdmin
    .from("phone_otps")
    .insert({
      phone: data.phone,
      code_hash: hashCode(code),
      expires_at: expiresAt,
      attempts: 0,
      used: false,
      ip_hash: ipHash,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[phone-otp] Failed to store OTP:", insertError);
    return { error: "Could not send code. Please try again." };
  }

  try {
    await sendClickatellSms(
      data.phone,
      `Your RedFlagDaddy code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Never share it with anyone.`,
    );
  } catch (error) {
    await supabaseAdmin.from("phone_otps").update({ used: true }).eq("id", stored.id);
    console.error("[phone-otp] Clickatell send failed:", error);
    return { error: "Could not send SMS. Please try again." };
  }

  return { sent: true };
}

export async function verifyPhoneOtpHandler(data: {
  phone: string;
  code: string;
  metadata?: OtpMetadata;
  ip?: string | null;
}) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("phone_otps")
    .select("id, code_hash, expires_at, attempts, used, locked_until")
    .eq("phone", data.phone)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("[phone-otp] Failed to fetch OTP:", fetchError);
    return { error: "Could not verify code. Please try again." };
  }

  const row = rows?.[0];
  if (!row) return { error: GENERIC_VERIFY_ERROR };
  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    return { error: "Too many attempts. This number is locked for 15 minutes." };
  }
  if (new Date(row.expires_at) < new Date()) return { error: GENERIC_VERIFY_ERROR };

  const newAttempts = row.attempts + 1;
  if (!safeCompare(row.code_hash, hashCode(data.code))) {
    const lockNow = newAttempts >= MAX_VERIFY_ATTEMPTS;
    await supabaseAdmin
      .from("phone_otps")
      .update({
        attempts: newAttempts,
        ...(lockNow ? { used: true, locked_until: new Date(Date.now() + LOCKOUT_MS).toISOString() } : {}),
      })
      .eq("id", row.id);
    if (lockNow) {
      console.warn("[phone-otp] Lockout triggered after repeated bad codes");
      return { error: "Too many attempts. This number is locked for 15 minutes." };
    }
    return { error: GENERIC_VERIFY_ERROR };
  }
  await supabaseAdmin.from("phone_otps").update({ used: true, attempts: newAttempts }).eq("id", row.id);

  const { data: existing, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    console.error("[phone-otp] Failed to list users:", listError);
    return { error: "Could not sign you in. Please try again." };
  }

  const digits = data.phone.replace(/\D/g, "");
  const existingUser = existing.users.find((user: User) => (user.phone ?? "").replace(/\D/g, "") === digits);
  const password = randomPassword();
  let userId: string;
  // Phone grant is disabled in Auth, so we bootstrap the session with an email+password grant.
  const syntheticEmail = `${digits}@phone.redflagdaddy.com`;
  let signInEmail: string;

  if (existingUser) {
    signInEmail = existingUser.email || syntheticEmail;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password,
      phone_confirm: true,
      ...(existingUser.email ? {} : { email: syntheticEmail, email_confirm: true }),
    });
    if (error) {
      console.error("[phone-otp] Failed to update user password:", error);
      return { error: "Could not sign you in. Please try again." };
    }
    userId = existingUser.id;
  } else {
    signInEmail = syntheticEmail;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      phone: data.phone,
      email: syntheticEmail,
      password,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: { name: data.metadata?.name, role: data.metadata?.role },
    });
    if (error || !created.user) {
      console.error("[phone-otp] Failed to create user:", error);
      return { error: "Could not create account. Please try again." };
    }
    userId = created.user.id;
  }

  const signInClient = getSupabaseSignInClient();
  const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({ email: signInEmail, password });
  if (signInError || !signInData.session) {
    console.error("[phone-otp] Failed to bootstrap session:", signInError);
    return { error: "Could not sign you in. Please try again." };
  }


  if (data.metadata?.name || data.metadata?.role) {
    const update: { name?: string | null; role?: Database["public"]["Enums"]["user_role"]; phone: string } = { phone: data.phone };
    if (data.metadata.name !== undefined) update.name = data.metadata.name || null;
    if (data.metadata.role !== undefined) update.role = data.metadata.role as Database["public"]["Enums"]["user_role"];
    await supabaseAdmin.from("users").update(update).eq("id", userId);
  }

  return {
    session: {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
    },
    userId,
  };
}