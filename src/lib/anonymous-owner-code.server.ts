const OWNER_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const OWNER_CODE_LENGTH = 24;

export function normalizeOwnerCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidOwnerCode(value: string): boolean {
  const normalized = normalizeOwnerCode(value);
  return (
    normalized.length === OWNER_CODE_LENGTH &&
    [...normalized].every((character) => OWNER_CODE_ALPHABET.includes(character))
  );
}

export function formatOwnerCode(value: string): string {
  const normalized = normalizeOwnerCode(value);
  return normalized.match(/.{1,6}/g)?.join("-") ?? normalized;
}

export function generateOwnerCode(): string {
  const characters: string[] = [];
  while (characters.length < OWNER_CODE_LENGTH) {
    const bytes = new Uint8Array(OWNER_CODE_LENGTH);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      // Reject the top 32 values so each of the 32 symbols is equally likely.
      if (byte >= 224) continue;
      characters.push(OWNER_CODE_ALPHABET[byte % OWNER_CODE_ALPHABET.length]!);
      if (characters.length === OWNER_CODE_LENGTH) break;
    }
  }
  return formatOwnerCode(characters.join(""));
}

export async function hashOwnerCode(value: string): Promise<string> {
  const normalized = normalizeOwnerCode(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
