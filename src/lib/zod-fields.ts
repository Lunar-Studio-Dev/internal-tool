import { z } from "zod";

/** Optional trimmed text that also accepts "" (callers normalize "" → null). */
export const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Empty or an http(s) URL (protocol optional, e.g. example.com). */
export const optionalUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => v === "" || isHttpUrl(v), "Enter a valid URL");

export function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export const optionalDateTime = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || isValidDateString(v), "Pick a valid date and time");

export const requiredDateTime = z
  .string()
  .min(1, "Pick a date and time")
  .refine((v) => isValidDateString(v), "Pick a valid date and time");
