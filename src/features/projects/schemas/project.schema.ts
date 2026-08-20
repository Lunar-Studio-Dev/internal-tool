import { z } from "zod";

import { optionalDateTime, optionalText } from "@/lib/zod-fields";

export const createProjectSchema = z.object({
  pipelineId: z.string().min(1),
  name: z.string().trim().min(1, "Project name is required").max(200),
  managerId: z.string().optional().or(z.literal("")),
  startDate: optionalDateTime,
  deadline: optionalDateTime,
  notes: optionalText(5000),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
