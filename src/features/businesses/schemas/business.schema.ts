import { z } from "zod";

import { SOURCE_CATEGORY_NAMES } from "@/features/businesses/constants";
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

const optionalId = z.string().optional().or(z.literal(""));

export const businessInfoSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(160),
  website: optionalUrl(300),
  email: optionalEmail,
  phone: optionalText(40),
  address: optionalText(400),
  social: socialSchema.optional(),
  notes: optionalText(2000),
});
export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;

export const businessProfileSchema = z.object({
  sectorId: optionalId,
  industryId: optionalId,
  marketId: optionalId,
  locationIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
});
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const businessSourceSchema = z.object({
  sourceCategoryId: z.string().min(1, "Select a source category"),
  sourceCategoryName: z.string().optional(),
  sourceSubCategoryId: optionalId,
  sourceReferredByBusinessId: optionalId,
  sourceReferenceLabel: optionalText(200),
  sourceReferenceNote: optionalText(1000),
});
export type BusinessSourceInput = z.infer<typeof businessSourceSchema>;

/** Primary contact captured during business creation (WF-08). */
export const primaryContactSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required").max(120),
  email: z.string().trim().email("Enter a valid contact email").max(200),
  phone: optionalText(40),
});

export const createBusinessSchema = businessInfoSchema
  .merge(businessProfileSchema)
  .merge(businessSourceSchema)
  .extend({
    contact: primaryContactSchema,
    /** Admin-only override to create despite duplicate matches (WF-09). */
    force: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const category = data.sourceCategoryName;
    if (category === SOURCE_CATEGORY_NAMES.CLUB && !data.sourceSubCategoryId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a club or sub-club",
        path: ["sourceSubCategoryId"],
      });
    }
    if (category === SOURCE_CATEGORY_NAMES.EXISTING_CLIENT && !data.sourceReferredByBusinessId) {
      ctx.addIssue({
        code: "custom",
        message: "Select the referring client",
        path: ["sourceReferredByBusinessId"],
      });
    }
    if (category === SOURCE_CATEGORY_NAMES.EXTERNAL && !data.sourceReferenceLabel?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a reference label",
        path: ["sourceReferenceLabel"],
      });
    }
  });

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = businessInfoSchema
  .merge(businessProfileSchema)
  .extend({
    id: z.string().min(1),
    sourceCategoryId: optionalId,
    sourceCategoryName: z.string().optional(),
    sourceSubCategoryId: optionalId,
    sourceReferredByBusinessId: optionalId,
    sourceReferenceLabel: optionalText(200),
    sourceReferenceNote: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    if (!data.sourceCategoryId) return;
    const category = data.sourceCategoryName;
    if (category === SOURCE_CATEGORY_NAMES.CLUB && !data.sourceSubCategoryId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a club or sub-club",
        path: ["sourceSubCategoryId"],
      });
    }
    if (category === SOURCE_CATEGORY_NAMES.EXISTING_CLIENT && !data.sourceReferredByBusinessId) {
      ctx.addIssue({
        code: "custom",
        message: "Select the referring client",
        path: ["sourceReferredByBusinessId"],
      });
    }
    if (category === SOURCE_CATEGORY_NAMES.EXTERNAL && !data.sourceReferenceLabel?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a reference label",
        path: ["sourceReferenceLabel"],
      });
    }
  });

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

/** Step-scoped schemas for wizard client validation. */
export const wizardStep1Schema = businessInfoSchema;
export const wizardStep2Schema = businessProfileSchema.extend({
  contact: primaryContactSchema,
});
export const wizardStep3Schema = businessSourceSchema;
