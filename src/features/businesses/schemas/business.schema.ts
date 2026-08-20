import { z } from "zod";

import { optionalText, optionalUrl } from "@/lib/zod-fields";

/** Optional email: accepts "" or a valid-looking address (business email is not required). */
const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email");

const socialSchema = z.object({
  linkedin: optionalUrl(300),
  instagram: optionalUrl(300),
  facebook: optionalUrl(300),
  x: optionalUrl(300),
});
export type SocialLinks = z.infer<typeof socialSchema>;

export const businessInfoSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(160),
  website: optionalUrl(300),
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
  email: z.string().trim().email("Enter a valid contact email").max(200),
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
