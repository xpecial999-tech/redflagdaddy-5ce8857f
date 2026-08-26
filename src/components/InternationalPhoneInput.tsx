import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import { cn } from "@/lib/utils";
import {
  countryFromPhone,
  DEFAULT_PHONE_COUNTRY,
  formatNationalPhone,
  toE164,
} from "@/lib/phone";
import { getPhoneCountryHint } from "@/lib/phone-country.functions";

type InternationalPhoneInputProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

function flag(country: CountryCode) {
  return country.replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}

export function InternationalPhoneInput({
  id,
  value,
  onValueChange,
  required,
  disabled,
  className,
  autoComplete = "tel",
  ...aria
}: InternationalPhoneInputProps) {
  const getCountryHint = useServerFn(getPhoneCountryHint);
  const initialCountry = countryFromPhone(value) ?? DEFAULT_PHONE_COUNTRY;
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const [display, setDisplay] = useState(() => formatNationalPhone(value, initialCountry));
  const countryWasChanged = useRef(false);
  const hint = useQuery({
    queryKey: ["phone-country-hint"],
    queryFn: () => getCountryHint(),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const countries = useMemo(() => {
    const names = typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames(["en"], { type: "region" })
      : null;
    return getCountries()
      .map((code) => ({ code, name: names?.of(code) ?? code, dial: getCountryCallingCode(code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    if (!value && !countryWasChanged.current && hint.data?.country) {
      setCountry(hint.data.country);
      setDisplay("");
    }
  }, [hint.data?.country, value]);

  useEffect(() => {
    const parsedCountry = countryFromPhone(value);
    if (parsedCountry && parsedCountry !== country && !display) setCountry(parsedCountry);
  }, [country, display, value]);

  const update = (nextDisplay: string, nextCountry = country) => {
    setDisplay(nextDisplay);
    onValueChange(nextDisplay.trim() ? toE164(nextDisplay, nextCountry) : "");
  };

  const changeCountry = (nextCountry: CountryCode) => {
    countryWasChanged.current = true;
    setCountry(nextCountry);
    const national = value ? formatNationalPhone(value, country) : display;
    update(national, nextCountry);
  };

  return (
    <div className={cn("flex w-full overflow-hidden rounded-xl border border-border bg-input focus-within:ring-2 focus-within:ring-ring", className)}>
      <label className="sr-only" htmlFor={id ? `${id}-country` : undefined}>Country</label>
      <select
        id={id ? `${id}-country` : undefined}
        value={country}
        onChange={(event) => changeCountry(event.target.value as CountryCode)}
        disabled={disabled}
        aria-label="Phone country"
        className="max-w-[7.5rem] border-0 border-r border-border bg-transparent px-2 text-sm outline-none"
      >
        {countries.map((item) => (
          <option key={item.code} value={item.code}>
            {flag(item.code)} +{item.dial} {item.name}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={display}
        onChange={(event) => update(event.target.value)}
        onBlur={() => value && setDisplay(formatNationalPhone(value, country))}
        placeholder="Mobile number"
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none"
        {...aria}
      />
    </div>
  );
}
