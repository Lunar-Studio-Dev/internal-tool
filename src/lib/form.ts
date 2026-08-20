import { z } from "zod";

export type FieldErrors = Record<string, string>;

export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_root";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function parseForm<S extends z.ZodType>(schema: S, data: unknown) {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { ok: true as const, data: parsed.data as z.output<S> };
  return {
    ok: false as const,
    errors: fieldErrorsFromZod(parsed.error),
    message: parsed.error.issues[0]?.message ?? "Invalid input",
  };
}
