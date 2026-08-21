export function isPeachSuccessCode(code: string): boolean {
  return /^(000\.000\.|000\.100\.1)/.test(code);
}

export function peachPaymentStatus(
  code: string,
  paymentDetailsMatch = true,
): "paid" | "pending" | "failed" {
  if (!paymentDetailsMatch) return "failed";
  if (isPeachSuccessCode(code)) return "paid";
  if (/^000\.200\./.test(code)) return "pending";
  return "failed";
}

export function formatCheckoutPrice(cents: number, currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase();

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "code",
    }).format(cents / 100);
  } catch {
    return `${normalizedCurrency || "USD"} ${(cents / 100).toFixed(2)}`;
  }
}

export async function verifyPeachWebhookSignature({
  secret,
  timestamp,
  webhookId,
  url,
  rawBody,
  receivedSignature,
}: {
  secret: string;
  timestamp: string;
  webhookId: string;
  url: string;
  rawBody: string;
  receivedSignature: string;
}): Promise<boolean> {
  if (!secret || !timestamp || !webhookId || !url || !receivedSignature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${webhookId}.${url}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return constantTimeEqual(expected, receivedSignature.trim().toLowerCase());
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
