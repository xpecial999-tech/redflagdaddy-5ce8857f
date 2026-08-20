import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import type { Database } from "@/integrations/supabase/types";
import { isValidE164, toE164 } from "./phone";

const OTP_REQUEST_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;
const CLICKATELL_URL = "https://platform.clickatell.com/v1/message";

type OtpMetadata = {
  name?: string;
  role?: "Dominant" | "submissive" | "switch";
};

function hashCode(code: string): string {
  const secret = process.env["OTP_SECRET"];
  if (!secret) throw new Error("OTP_SECRET is not configured");
  return createHmac("sha256", secret).update(code).digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function generateSixDigitCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1_000_000).padStart(6, "0");
}

function randomPassword(): string {
  return randomBytes(32).toString("base64");
}

type SupabaseAdminClient = SupabaseClient<Database>;

async function getSupabaseAdmin(): Promise<SupabaseAdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as SupabaseAdminClient;
}

function getSupabaseSignInClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Supabase service role not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

async function sendClickatellSms(phone: string, message: string) {
  const apiKey = process.env["CLICKATELL_API_KEY"];
  if (!apiKey) throw new Error("CLICKATELL_API_KEY is not configured");

  const response = await fetch(CLICKATELL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ content: message, to: [phone] }),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`[clickatell-sms] Provider error ${response.status}: ${body}`);
    throw new Error(`Clickatell error: ${response.status}`);
  }
  return body;
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

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => {
    if (typeof data.phone !== "string") throw new Error("Phone is required");
    const normalized = toE164(data.phone);
    if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
    return { phone: normalized };
  })
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();

    const recent = await countRecentRequests(supabaseAdmin, data.phone);
    if (recent >= MAX_OTP_REQUESTS_PER_WINDOW) {
      return { error: "Too many code requests. Please wait 10 minutes and try again." };
    }

    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from("phone_otps").insert({
      phone: data.phone,
      code_hash: hashCode(code),
      expires_at: expiresAt,
      attempts: 0,
      used: false,
    });

    if (insertError) {
      console.error("[phone-otp] Failed to store OTP:", insertError);
      return { error: "Could not send code. Please try again." };
    }

    try {
      await sendClickatellSms(data.phone, `Your RedFlagDaddy code is ${code}.`);
    } catch (err) {
      console.error("[phone-otp] Clickatell send failed:", err);
      return { error: "Could not send SMS. Please try again." };
    }

    return { sent: true };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; code: string; metadata?: OtpMetadata }) => {
    if (typeof data.phone !== "string" || typeof data.code !== "string") {
      throw new Error("Phone and code are required");
    }
    const normalized = toE164(data.phone);
    if (!isValidE164(normalized)) throw new Error("Invalid phone number.");
    const code = data.code.replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Enter the 6-digit code.");
    return { phone: normalized, code, metadata: data.metadata };
  })
  .handler(async ({ data }) => {
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
    if (!row) {
      return { error: "Invalid or expired code." };
    }

    if (new Date(row.expires_at) < new Date()) {
      return { error: "Code has expired. Please request a new one." };
    }

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

    // Find or create the auth user by phone.
    const { data: existing, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) {
      console.error("[phone-otp] Failed to list users:", listError);
      return { error: "Could not sign you in. Please try again." };
    }

    // Supabase stores phones without the leading "+", so compare digits only.
    const digits = data.phone.replace(/\D/g, "");
    const existingUser = existing.users.find(
      (u: User) => (u.phone ?? "").replace(/\D/g, "") === digits,
    );
    const password = randomPassword();

    let userId: string;
    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        phone_confirm: true,
      });
      if (updateError) {
        console.error("[phone-otp] Failed to update user password:", updateError);
        return { error: "Could not sign you in. Please try again." };
      }
      userId = existingUser.id;
    } else {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: data.phone,
        password,
        phone_confirm: true,
        user_metadata: {
          name: data.metadata?.name,
          role: data.metadata?.role,
        },
      });
      if (createError || !created.user) {
        console.error("[phone-otp] Failed to create user:", createError);
        return { error: "Could not create account. Please try again." };
      }
      userId = created.user.id;
    }

    // Bootstrap a Supabase session server-side.
    const signInClient = getSupabaseSignInClient();
    const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({
      phone: data.phone,
      password,
    });

    if (signInError || !signInData.session) {
      console.error("[phone-otp] Failed to bootstrap session:", signInError);
      return { error: "Could not sign you in. Please try again." };
    }

    // Ensure the public.users profile carries the latest metadata.
    if (data.metadata?.name || data.metadata?.role) {
      const update: { name?: string | null; role?: "Dominant" | "submissive" | "switch"; phone: string } = {
        phone: data.phone,
      };
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
  });
