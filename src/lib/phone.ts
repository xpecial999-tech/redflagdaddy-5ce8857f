// Shared phone-number helpers for mobile sign-in.

export const DEFAULT_DIAL_CODE = "+27"; // South Africa

/** Normalise user input into E.164, e.g. "082 123 4567" -> "+27821234567". */
export function toE164(input: string, dialCode: string = DEFAULT_DIAL_CODE): string {
  const raw = input.replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return "+" + raw.slice(1).replace(/\D/g, "");
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^0+/, "");
  return `${dialCode}${local}`;
}

export function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

/** Pretty display: "+27 82 123 4567" (loose grouping, purely cosmetic). */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\+\d{1,3}?)(\d{9,})$/.exec(value);
  if (!m) return value;
  const rest = m[2].replace(/(\d{2})(\d{3})(\d+)/, "$1 $2 $3");
  return `${m[1]} ${rest}`;
}
