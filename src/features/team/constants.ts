import { MemberStatus, RoleName } from "@/generated/prisma/enums";

export const ROLE_ORDER: RoleName[] = [
  RoleName.ADMIN,
  RoleName.CLIENT_MANAGER,
  RoleName.BUSINESS_ANALYST,
  RoleName.SALES,
  RoleName.FINANCE,
  RoleName.DEVELOPER,
  RoleName.PROJECT_MANAGER,
];

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Admin",
  CLIENT_MANAGER: "Client Manager",
  BUSINESS_ANALYST: "Business Analyst",
  SALES: "Sales",
  FINANCE: "Finance",
  DEVELOPER: "Developer",
  PROJECT_MANAGER: "Project Manager",
};

/** Human-readable scope summary for the read-only roles matrix (WF-47). */
export const ROLE_SUMMARIES: Record<RoleName, string> = {
  ADMIN: "Full system access",
  CLIENT_MANAGER: "Businesses, Pipelines, Tasks, Resources",
  BUSINESS_ANALYST: "Business, Requirement, Resources, Tasks",
  SALES: "Businesses, Discovery, Quotation, Tasks",
  FINANCE: "Accounts, Payments, Businesses",
  DEVELOPER: "Assigned Projects, Resources, Tasks",
  PROJECT_MANAGER: "Projects, Pipelines, Tasks, Resources",
};

export const STATUS_OPTIONS: MemberStatus[] = [MemberStatus.ACTIVE, MemberStatus.INACTIVE];
