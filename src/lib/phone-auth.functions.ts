import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requestPhoneOtpHandler, verifyPhoneOtpHandler, type OtpMetadata } from "./phone-auth.server";
import { isValidE164, toE164 } from "./phone";

function callerIp(): string | null {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-real-ip") ?? null;
}

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => {
    if (typeof data.phone !== "string") throw new Error("Phone is required");
    const normalized = toE164(data.phone);
    if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
    return { phone: normalized };
  })
  .handler(async ({ data }) => requestPhoneOtpHandler({ ...data, ip: callerIp() }));

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; code: string; metadata?: OtpMetadata }) => {
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
          ...(["Dominant", "submissive", "switch"].includes(data.metadata.role as string)
            ? { role: data.metadata.role }
            : {}),
        }
      : undefined;
    return { phone: normalized, code, metadata };
  })
  .handler(async ({ data }) => verifyPhoneOtpHandler({ ...data, ip: callerIp() }));
