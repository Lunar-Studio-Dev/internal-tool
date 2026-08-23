import { z } from "zod";

import { optionalText } from "@/lib/zod-fields";

export const createPipelineSchema = z.object({
  businessId: z.string().min(1, "Select a business"),
  name: z.string().trim().min(1, "Pipeline name is required").max(160),
  assigneeIds: z.array(z.string()).optional().default([]),
  notes: optionalText(2000),
});
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

export const promotePipelineSchema = z.object({
  pipelineId: z.string().min(1),
  notes: optionalText(1000),
});

export const deactivatePipelineSchema = z.object({
  pipelineId: z.string().min(1),
  reasonId: z.string().min(1, "Select a reason"),
  notes: optionalText(1000),
});

export const completePipelineSchema = z.object({
  pipelineId: z.string().min(1),
  notes: optionalText(1000),
});

export const reactivatePipelineSchema = z.object({
  pipelineId: z.string().min(1),
  notes: optionalText(1000),
});
