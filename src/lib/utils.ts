import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Trim empty strings to null for optional DB columns. */
export function emptyToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

/** Sentinel for shadcn Select when the real value is empty. */
export const NONE_SELECT_VALUE = "NONE";

/** Format integer minor units (paise) as a currency string. Money is stored as paise. */
export function formatMoney(minorUnits: number, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((minorUnits ?? 0) / 100);
}

/** Format a date consistently (default: 02 Aug 2026). */
export function formatDate(
  value: Date | string | number,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}
