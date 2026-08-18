import { z } from "zod";

import { PhaseType, ResourceType } from "@/generated/prisma/enums";

const RESOURCE_TYPE_VALUES = Object.values(ResourceType) as [ResourceType, ...ResourceType[]];
const PHASE_VALUES = Object.values(PhaseType) as [PhaseType, ...PhaseType[]];
const optionalId = z.string().optional().or(z.literal(""));

/** Saved after the browser has PUT the file to R2 (objectKey comes from /api/r2). */
export const createResourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(RESOURCE_TYPE_VALUES),
  objectKey: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().optional(),
  contentType: z.string().max(200).optional().or(z.literal("")),
  businessId: optionalId,
  pipelineId: optionalId,
  phaseType: z.enum(PHASE_VALUES).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
