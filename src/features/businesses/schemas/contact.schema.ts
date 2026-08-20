import { z } from "zod";

import { ContactRole } from "@/generated/prisma/enums";
import { optionalText } from "@/lib/zod-fields";

const ROLE_VALUES = Object.values(ContactRole) as [ContactRole, ...ContactRole[]];

export const contactSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: optionalText(40),
  role: z.enum(ROLE_VALUES),
  isPrimary: z.boolean(),
  notes: optionalText(1000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const createContactSchema = contactSchema;

export const updateContactSchema = contactSchema.extend({ id: z.string().min(1) });
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
