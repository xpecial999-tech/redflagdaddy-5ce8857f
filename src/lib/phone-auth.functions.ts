import { createServerFn } from "@tanstack/react-start";
import { requestPhoneOtpHandler, verifyPhoneOtpHandler, type OtpMetadata } from "./phone-auth.server";
import { isValidE164, toE164 } from "./phone";

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => {
    if (typeof data.phone !== "string") throw new Error("Phone is required");
    const normalized = toE164(data.phone);
    if (!isValidE164(normalized)) throw new Error("Enter a valid mobile number with country code.");
    return { phone: normalized };
  })
  .handler(async ({ data }) => requestPhoneOtpHandler(data));

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
  .handler(async ({ data }) => verifyPhoneOtpHandler(data));
