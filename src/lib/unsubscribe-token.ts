const UNSUBSCRIBE_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function normalizeUnsubscribeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return UNSUBSCRIBE_TOKEN_PATTERN.test(token) ? token.toLowerCase() : null;
}
