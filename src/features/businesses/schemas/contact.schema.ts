import { z } from "zod";

import { ContactRole } from "@/generated/prisma/enums";

const ROLE_VALUES = Object.values(ContactRole) as [ContactRole, ...ContactRole[]];

export const contactSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(ROLE_VALUES),
  isPrimary: z.boolean(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const createContactSchema = contactSchema;

export const updateContactSchema = contactSchema.extend({ id: z.string().min(1) });
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
