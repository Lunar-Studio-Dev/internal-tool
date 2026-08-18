import { z } from "zod";

/** Optional trimmed text that also accepts "" (callers normalize "" → null). */
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Optional email: accepts "" or a valid-looking address (business email is not required). */
const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email");

const socialSchema = z.object({
  linkedin: optionalText(300),
  instagram: optionalText(300),
  facebook: optionalText(300),
  x: optionalText(300),
});
export type SocialLinks = z.infer<typeof socialSchema>;

export const businessInfoSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(160),
  website: optionalText(300),
  email: optionalEmail,
  phone: optionalText(40),
  industry: optionalText(120),
  location: optionalText(160),
  address: optionalText(400),
  social: socialSchema.optional(),
  notes: optionalText(2000),
});
export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;

/** Primary contact captured during business creation (WF-08). */
export const primaryContactSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required").max(120),
  email: z.string().trim().email("Enter a valid contact email"),
  phone: optionalText(40),
});

export const createBusinessSchema = businessInfoSchema.extend({
  contact: primaryContactSchema,
  /** Admin-only override to create despite duplicate matches (WF-09). */
  force: z.boolean().optional(),
});
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = businessInfoSchema.extend({
  id: z.string().min(1),
});
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
