import { z } from "zod";

import { RoleName } from "@/generated/prisma/enums";

const ROLE_VALUES = Object.values(RoleName) as [RoleName, ...RoleName[]];

// Status is system-managed (PENDING on create → ACTIVE on verify; INACTIVE via
// deactivate) — it is intentionally NOT part of the create/update form.
export const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  roles: z.array(z.enum(ROLE_VALUES)).min(1, "Select at least one role"),
});
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.extend({
  id: z.string().min(1),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
