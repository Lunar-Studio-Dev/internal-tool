import { z } from "zod";

import { PhaseType, Priority, TaskStatus } from "@/generated/prisma/enums";
import { optionalDateTime, optionalText } from "@/lib/zod-fields";

const PRIORITY_VALUES = Object.values(Priority) as [Priority, ...Priority[]];
const STATUS_VALUES = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
const PHASE_VALUES = Object.values(PhaseType) as [PhaseType, ...PhaseType[]];

const optionalId = z.string().optional().or(z.literal(""));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  assigneeId: optionalId,
  dueAt: optionalDateTime,
  priority: z.enum(PRIORITY_VALUES),
  businessId: optionalId,
  pipelineId: optionalId,
  phaseType: z.enum(PHASE_VALUES).optional().or(z.literal("")),
  notes: optionalText(2000),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.extend({
  id: z.string().min(1),
  status: z.enum(STATUS_VALUES),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const reassignTaskSchema = z.object({
  id: z.string().min(1),
  assigneeId: z.string().min(1, "Select an assignee"),
});
