// Shared international phone-number helpers.

import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export const DEFAULT_DIAL_CODE = "+27"; // South Africa
export const DEFAULT_PHONE_COUNTRY: CountryCode = "ZA";

/** Normalise user input into E.164, e.g. "082 123 4567" -> "+27821234567". */
export function toE164(
  input: string,
  countryOrDialCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string {
  const raw = input.replace(/[^\d+]/g, "");
  if (!raw) return "";
  const country = /^[A-Z]{2}$/.test(countryOrDialCode) ? (countryOrDialCode as CountryCode) : undefined;
  const parsed = parsePhoneNumberFromString(input, country);
  if (parsed) return parsed.number;
  if (raw.startsWith("+")) return `+${raw.slice(1).replace(/\D/g, "")}`;
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^0+/, "");
  const dialCode = country
    ? `+${getCountryCallingCode(country)}`
    : countryOrDialCode.startsWith("+")
      ? countryOrDialCode
      : DEFAULT_DIAL_CODE;
  return `${dialCode}${local}`;
}

export function isValidE164(value: string): boolean {
  return parsePhoneNumberFromString(value)?.isValid() ?? false;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value;
}

export function formatNationalPhone(value: string, country: CountryCode): string {
  if (!value) return "";
  const parsed = parsePhoneNumberFromString(value, country);
  return parsed?.country === country ? parsed.formatNational() : new AsYouType(country).input(value);
}

export function countryFromPhone(value: string): CountryCode | null {
  return parsePhoneNumberFromString(value)?.country ?? null;
}
