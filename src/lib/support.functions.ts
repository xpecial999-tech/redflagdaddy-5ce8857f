import { createServerFn } from "@tanstack/react-start";
import { SupportRequestSchema, supportCategoryLabels, supportConcernLabels } from "./support";

type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

async function verifyTurnstile(token: string, remoteIp: string | null): Promise<void> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) {
    console.error("[support] TURNSTILE_SECRET_KEY is not configured");
    throw new Error("The support form is temporarily unavailable. Please email support instead.");
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    console.error("[support] Turnstile verification request failed", { status: response.status });
    throw new Error("The security check could not be verified. Please try again.");
  }

  const result = (await response.json()) as TurnstileResult;
  if (!result.success) {
    console.warn("[support] Turnstile rejected a submission", {
      errors: result["error-codes"]?.slice(0, 5),
    });
    throw new Error("Please complete the security check and try again.");
  }

  if (result.action !== "support_request") {
    console.warn("[support] Turnstile action mismatch", { action: result.action });
    throw new Error("The security check could not be verified. Please try again.");
  }

  const expectedHostname = process.env["TURNSTILE_EXPECTED_HOSTNAME"]?.trim().toLowerCase();
  if (expectedHostname && result.hostname?.toLowerCase() !== expectedHostname) {
    console.warn("[support] Turnstile hostname mismatch", { hostname: result.hostname });
    throw new Error("The security check could not be verified. Please try again.");
  }
}

function createReference(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `RFD-${date}-${suffix}`;
}

export const submitSupportRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => SupportRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { callerIp, consumeRateLimits, RateLimitError } = await import("./rate-limit.server");
    const ip = callerIp();
    await verifyTurnstile(data.turnstileToken, ip);

    try {
      await consumeRateLimits([
        { action: "support_request_ip", value: ip, windowSeconds: 60 * 60, maxEvents: 5 },
        {
          action: "support_request_email",
          value: data.replyEmail,
          windowSeconds: 60 * 60,
          maxEvents: 3,
        },
      ]);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error("Too many support requests. Please wait before trying again.");
      }
      throw error;
    }

    const reference = createReference();
    const { sendAppEmail } = await import("./email/queue.server");
    const result = await sendAppEmail({
      templateName: "support-request",
      to: "support@redflagdaddy.com",
      idempotencyKey: reference,
      templateData: {
        reference,
        category: supportCategoryLabels[data.category],
        replyEmail: data.replyEmail,
        concerns: supportConcernLabels[data.concerns],
        journeyReference: data.journeyReference || null,
        message: data.message,
      },
    });

    if (!result.ok) {
      console.error("[support] Notification could not be queued", {
        reference,
        reason: result.reason,
      });
      throw new Error(
        "Your request could not be sent. Please email support@redflagdaddy.com instead.",
      );
    }

    return { ok: true as const, reference };
  });
