import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
