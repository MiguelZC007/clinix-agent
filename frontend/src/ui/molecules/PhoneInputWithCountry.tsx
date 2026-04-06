"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CountryCode = {
  code: string;
  dialCode: string;
  flag: string;
};

const COUNTRIES: CountryCode[] = [
  { code: "VE", dialCode: "+58", flag: "🇻🇪" },
  { code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { code: "AR", dialCode: "+54", flag: "🇦🇷" },
  { code: "CL", dialCode: "+56", flag: "🇨🇱" },
  { code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { code: "EC", dialCode: "+593", flag: "🇪🇨" },
  { code: "BO", dialCode: "+591", flag: "🇧🇴" },
  { code: "PY", dialCode: "+595", flag: "🇵🇾" },
  { code: "UY", dialCode: "+598", flag: "🇺🇾" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { code: "US", dialCode: "+1", flag: "🇺🇸" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸" },
];

function useCountryDisplayName(): (code: string) => string {
  const locale = useLocale();
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return (code: string) => dn.of(code) ?? code;
  } catch {
    return (code: string) => code;
  }
}

type PhoneInputWithCountryProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultCountry?: string;
};

export function PhoneInputWithCountry({
  value = "",
  onChange,
  onBlur,
  placeholder = "1234567890",
  className,
  disabled = false,
  defaultCountry = "BO",
}: PhoneInputWithCountryProps) {
  const getInitialCountry = () => {
    if (value) {
      const country = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (country) return country;
    }
    return COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0];
  };

  const getInitialPhoneNumber = () => {
    if (value) {
      const country = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (country) {
        return value.replace(country.dialCode, "");
      }
      return value;
    }
    return "";
  };

  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(getInitialCountry);
  const [phoneNumber, setPhoneNumber] = useState<string>(
    getInitialPhoneNumber(),
  );

  // Sincronizar con el valor externo cuando cambia
  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dialCode, ""));
      } else {
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber("");
    }
  }, [value]);

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const fullNumber = country.dialCode + phoneNumber;
      onChange?.(fullNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, "");
    setPhoneNumber(number);
    const fullNumber = selectedCountry.dialCode + number;
    onChange?.(fullNumber);
  };

  const countryName = useCountryDisplayName();

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={selectedCountry.code}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-[140px]"
          aria-label={countryName(selectedCountry.code)}
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span className="text-sm">{countryName(country.code)}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {country.dialCode}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
