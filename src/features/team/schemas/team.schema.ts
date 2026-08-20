import { z } from "zod";

import { MemberStatus, RoleName } from "@/generated/prisma/enums";
import { optionalText } from "@/lib/zod-fields";

const ROLE_VALUES = Object.values(RoleName) as [RoleName, ...RoleName[]];

// Status is system-managed (PENDING on create → ACTIVE on verify; INACTIVE via
// deactivate) — it is intentionally NOT part of the create/update form.
export const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: optionalText(40),
  roles: z.array(z.enum(ROLE_VALUES)).min(1, "Select at least one role"),
});
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.extend({
  id: z.string().min(1),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const memberStatusSchema = z.object({
  status: z.enum([MemberStatus.ACTIVE, MemberStatus.INACTIVE]),
});
