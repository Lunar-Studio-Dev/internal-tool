import { z } from "zod";

import { optionalText } from "@/lib/zod-fields";

export const createNamedTaxonomySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const updateNamedTaxonomySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const setTaxonomyActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export const createIndustrySchema = createNamedTaxonomySchema.extend({
  sectorId: z.string().optional().or(z.literal("")),
});

export const updateIndustrySchema = updateNamedTaxonomySchema.extend({
  sectorId: z.string().optional().or(z.literal("")),
});

export const createSourceSubCategorySchema = createNamedTaxonomySchema.extend({
  sourceCategoryId: z.string().min(1, "Category is required"),
  parentId: z.string().optional().or(z.literal("")),
});

export const updateSourceCategorySchema = updateNamedTaxonomySchema.extend({
  allowsSubcategories: z.boolean().optional(),
});

export const updateSourceSubCategorySchema = updateNamedTaxonomySchema.extend({
  sourceCategoryId: z.string().optional(),
  parentId: z.string().optional().or(z.literal("")).nullable(),
});

export type CreateNamedTaxonomyInput = z.infer<typeof createNamedTaxonomySchema>;
export type CreateIndustryInput = z.infer<typeof createIndustrySchema>;
export type CreateSourceSubCategoryInput = z.infer<typeof createSourceSubCategorySchema>;
