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
  role?: "Dominant" | "submissive" | "switch";
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

export async function sendClickatellSms(phone: string, content: string) {
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

async function countRecentRequests(supabaseAdmin: SupabaseAdminClient, phone: string) {
  const since = new Date(Date.now() - OTP_REQUEST_WINDOW_MS).toISOString();
  const { count, error } = await supabaseAdmin
    .from("phone_otps")
    .select("*", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

export async function requestPhoneOtpHandler(data: { phone: string }) {
  const supabaseAdmin = await getSupabaseAdmin();
  const recent = await countRecentRequests(supabaseAdmin, data.phone);
  if (recent >= MAX_OTP_REQUESTS_PER_WINDOW) {
    return { error: "Too many code requests. Please wait 10 minutes and try again." };
  }

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const { data: stored, error: insertError } = await supabaseAdmin
    .from("phone_otps")
    .insert({ phone: data.phone, code_hash: hashCode(code), expires_at: expiresAt, attempts: 0, used: false })
    .select("id")
    .single();

  if (insertError) {
    console.error("[phone-otp] Failed to store OTP:", insertError);
    return { error: "Could not send code. Please try again." };
  }

  try {
    await sendClickatellSms(data.phone, `Your RedFlagDaddy code is ${code}.`);
  } catch (error) {
    await supabaseAdmin.from("phone_otps").update({ used: true }).eq("id", stored.id);
    console.error("[phone-otp] Clickatell send failed:", error);
    return { error: "Could not send SMS. Please try again." };
  }

  return { sent: true };
}

export async function verifyPhoneOtpHandler(data: { phone: string; code: string; metadata?: OtpMetadata }) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("phone_otps")
    .select("id, code_hash, expires_at, attempts, used")
    .eq("phone", data.phone)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("[phone-otp] Failed to fetch OTP:", fetchError);
    return { error: "Could not verify code. Please try again." };
  }

  const row = rows?.[0];
  if (!row) return { error: "Invalid or expired code." };
  if (new Date(row.expires_at) < new Date()) return { error: "Code has expired. Please request a new one." };
  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    await supabaseAdmin.from("phone_otps").update({ used: true }).eq("id", row.id);
    return { error: "Too many attempts. Please request a new code." };
  }

  const newAttempts = row.attempts + 1;
  if (!safeCompare(row.code_hash, hashCode(data.code))) {
    await supabaseAdmin.from("phone_otps").update({ attempts: newAttempts }).eq("id", row.id);
    return { error: "Invalid code." };
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
    const update: { name?: string | null; role?: "Dominant" | "submissive" | "switch"; phone: string } = { phone: data.phone };
    if (data.metadata.name !== undefined) update.name = data.metadata.name || null;
    if (data.metadata.role !== undefined) update.role = data.metadata.role;
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