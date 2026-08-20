import { z } from "zod";

import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from "@/features/resources/constants";
import { PhaseType, ResourceType } from "@/generated/prisma/enums";
import { optionalText } from "@/lib/zod-fields";

const RESOURCE_TYPE_VALUES = Object.values(ResourceType) as [ResourceType, ...ResourceType[]];
const PHASE_VALUES = Object.values(PhaseType) as [PhaseType, ...PhaseType[]];
const optionalId = z.string().optional().or(z.literal(""));

const MIME_VALUES = ALLOWED_UPLOAD_MIME as [string, ...string[]];

/** Form fields collected before the R2 key exists. */
export const resourceMetaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(RESOURCE_TYPE_VALUES),
  businessId: optionalId,
  pipelineId: optionalId,
  phaseType: z.enum(PHASE_VALUES).optional().or(z.literal("")),
  description: optionalText(1000),
});

/** Saved after the browser has PUT the file to R2 (objectKey comes from /api/r2). */
export const createResourceSchema = resourceMetaSchema.extend({
  objectKey: z
    .string()
    .min(1)
    .refine((key) => key.startsWith("resources/"), "Invalid storage key."),
  sizeBytes: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES).optional(),
  contentType: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || MIME_VALUES.includes(v), "Unsupported file type."),
});
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
