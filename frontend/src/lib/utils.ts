import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { enUS, es } from "date-fns/locale";
import type { Locale } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts the app locale (e.g. "es", "en") into a full BCP 47 tag
 * to be used with `toLocaleDateString`, `toLocaleTimeString`, etc.
 * This prevents implicit browser-locale drift.
 */
const LOCALE_MAP: Record<string, string> = { es: "es-ES", en: "en-US" };
export function toDateLocale(appLocale: string): string {
  return LOCALE_MAP[appLocale] ?? appLocale;
}

/**
 * Returns the date-fns locale object for the given app locale code.
 * Use this with react-day-picker v9's `locale` prop.
 */
const DATE_FNS_LOCALE_MAP: Record<string, Locale> = { es, en: enUS };
export function toDateFnsLocale(appLocale: string): Locale {
  return DATE_FNS_LOCALE_MAP[appLocale] ?? enUS;
}

/**
 * Compares two dates using UTC values to avoid timezone issues.
 * Use this when comparing dates that may come from different timezone contexts.
 */
export function isSameDayUTC(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Converts an unknown error to an Error instance.
 * Use this instead of `error as Error` for proper type safety.
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}/;

export function formatDateToYYYYMMDD(
  value: string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (YYYY_MM_DD_REGEX.test(trimmed)) return trimmed.slice(0, 10);
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
