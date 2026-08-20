import { z } from "zod";

import { PhaseType } from "@/generated/prisma/enums";
import { optionalText, requiredDateTime } from "@/lib/zod-fields";

const PHASE_VALUES = Object.values(PhaseType) as [PhaseType, ...PhaseType[]];

export const createFollowUpSchema = z.object({
  businessId: z.string().optional().or(z.literal("")),
  pipelineId: z.string().optional().or(z.literal("")),
  phaseType: z.enum(PHASE_VALUES).optional().or(z.literal("")),
  reason: z.string().trim().min(1, "Reason is required").max(200),
  dueAt: requiredDateTime,
  assigneeId: z.string().optional().or(z.literal("")),
  notes: optionalText(1000),
});
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const updateFollowUpSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(200),
  dueAt: requiredDateTime,
  assigneeId: z.string().optional().or(z.literal("")),
  notes: optionalText(1000),
  rescheduleNotes: optionalText(500),
});
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
