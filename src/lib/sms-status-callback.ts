const MAX_CALLBACK_BYTES = 64 * 1024;
const MAX_CALLBACK_EVENTS = 100;

export class SmsStatusCallbackError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SmsStatusCallbackError";
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

export function verifySmsStatusAuthorization(
  authorization: string | null,
  expectedUsername: string | undefined,
  expectedPassword: string | undefined,
): "authorized" | "unauthorized" | "unconfigured" {
  if (!expectedUsername || !expectedPassword) return "unconfigured";
  if (!authorization?.startsWith("Basic ")) return "unauthorized";

  try {
    const supplied = atob(authorization.slice(6).trim());
    return constantTimeEqual(supplied, `${expectedUsername}:${expectedPassword}`)
      ? "authorized"
      : "unauthorized";
  } catch {
    return "unauthorized";
  }
}

export async function readBoundedSmsStatusBody(
  request: Request,
  maximumBytes = MAX_CALLBACK_BYTES,
): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new SmsStatusCallbackError("payload too large", 413);
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new SmsStatusCallbackError("payload too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export type SmsStatusUpdate = {
  id: string;
  status: string;
  error: string | null;
};

export function parseSmsStatusUpdates(raw: string): SmsStatusUpdate[] {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new SmsStatusCallbackError("bad payload", 400);
  }

  if (!payload || typeof payload !== "object") {
    throw new SmsStatusCallbackError("bad payload", 400);
  }

  const root = payload as Record<string, unknown>;
  const events: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(root.statuses)
      ? root.statuses
      : Array.isArray(root.messages)
        ? root.messages
        : [payload];

  return events.slice(0, MAX_CALLBACK_EVENTS).flatMap((event) => {
    if (!event || typeof event !== "object") return [];
    const value = event as Record<string, unknown>;
    const rawId = value.apiMessageId ?? value.messageId;
    if (typeof rawId !== "string" || rawId.length === 0) return [];
    return [
      {
        id: rawId.slice(0, 200),
        status: String(value.statusDescription ?? value.status ?? "unknown").slice(0, 200),
        error:
          typeof value.errorDescription === "string" ? value.errorDescription.slice(0, 500) : null,
      },
    ];
  });
}
