import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requestPhoneOtpHandler, verifyPhoneOtpHandler, type OtpMetadata } from "./phone-auth.server";
import { isValidE164, toE164 } from "./phone";
import { isRole } from "./roles";

function callerIp(): string | null {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-real-ip") ?? null;
}

const OtpPurpose = ["login", "register", "admin"] as const;
type OtpPurpose = (typeof OtpPurpose)[number];

function parsePurpose(value: unknown): OtpPurpose {
  return OtpPurpose.includes(value as OtpPurpose) ? (value as OtpPurpose) : "login";
}

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; purpose?: OtpPurpose }) => {
    if (typeof data.phone !== "string") throw new Error("Phone is required");
    const normalized = toE164(data.phone);
    if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
    return { phone: normalized, purpose: parsePurpose(data.purpose) };
  })
  .handler(async ({ data }) => {
    const { assertOtpPurposeAllowed } = await import("./construction-mode.server");
    await assertOtpPurposeAllowed(data.purpose, data.phone);
    return requestPhoneOtpHandler({ phone: data.phone, ip: callerIp() });
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; code: string; metadata?: OtpMetadata; purpose?: OtpPurpose }) => {
    if (typeof data.phone !== "string" || typeof data.code !== "string") {
      throw new Error("Phone and code are required");
    }
    const normalized = toE164(data.phone);
    if (!isValidE164(normalized)) throw new Error("Invalid phone number.");
    const code = data.code.replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Enter the 6-digit code.");
    const metadata: OtpMetadata | undefined = data.metadata
      ? {
          ...(typeof data.metadata.name === "string" ? { name: data.metadata.name.trim().slice(0, 80) } : {}),
          ...(typeof data.metadata.role === "string" && isRole(data.metadata.role)
            ? { role: data.metadata.role }
            : {}),
        }
      : undefined;
    return { phone: normalized, code, metadata, purpose: parsePurpose(data.purpose) };
  })
  .handler(async ({ data }) => {
    const { assertOtpPurposeAllowed } = await import("./construction-mode.server");
    await assertOtpPurposeAllowed(data.purpose, data.phone);
    return verifyPhoneOtpHandler({
      phone: data.phone,
      code: data.code,
      metadata: data.metadata,
      ip: callerIp(),
    });
  });
