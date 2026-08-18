import { ContactRole } from "@/generated/prisma/enums";

export const CONTACT_ROLE_ORDER: ContactRole[] = [
  ContactRole.OWNER,
  ContactRole.MANAGER,
  ContactRole.CTO,
  ContactRole.OTHER,
];

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  CTO: "CTO",
  OTHER: "Other",
};
