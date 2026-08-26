import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getCountries, type CountryCode } from "libphonenumber-js/min";
import { DEFAULT_PHONE_COUNTRY } from "./phone";

const supportedCountries = new Set<CountryCode>(getCountries());

export function normalizeCountryHint(value: string | null | undefined): CountryCode {
  const country = value?.trim().toUpperCase() as CountryCode | undefined;
  return country && supportedCountries.has(country) ? country : DEFAULT_PHONE_COUNTRY;
}

export const getPhoneCountryHint = createServerFn({ method: "GET" }).handler(() => ({
  country: normalizeCountryHint(getRequestHeader("cf-ipcountry")),
}));
