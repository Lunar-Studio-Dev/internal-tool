import { z } from "zod";

import { LeadSource } from "@/generated/prisma/enums";

const LEAD_SOURCE_VALUES = Object.values(LeadSource) as [LeadSource, ...LeadSource[]];

export const createPipelineSchema = z.object({
  businessId: z.string().min(1, "Select a business"),
  name: z.string().trim().min(1, "Pipeline name is required").max(160),
  opportunityType: z.string().trim().max(160).optional().or(z.literal("")),
  leadSource: z.enum(LEAD_SOURCE_VALUES),
  ownerId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

export const promotePipelineSchema = z.object({
  pipelineId: z.string().min(1),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const deactivatePipelineSchema = z.object({
  pipelineId: z.string().min(1),
  reasonId: z.string().min(1, "Select a reason"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
