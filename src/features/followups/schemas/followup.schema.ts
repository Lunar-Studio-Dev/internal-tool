import { z } from "zod";

import { PhaseType } from "@/generated/prisma/enums";

const PHASE_VALUES = Object.values(PhaseType) as [PhaseType, ...PhaseType[]];

export const createFollowUpSchema = z.object({
  businessId: z.string().optional().or(z.literal("")),
  pipelineId: z.string().optional().or(z.literal("")),
  phaseType: z.enum(PHASE_VALUES).optional().or(z.literal("")),
  reason: z.string().trim().min(1, "Reason is required").max(200),
  dueAt: z.string().min(1, "Pick a date and time"),
  assigneeId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
