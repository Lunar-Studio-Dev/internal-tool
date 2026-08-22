import { LeadSource, PhaseType, PipelineStatus } from "@/generated/prisma/enums";

/**
 * Fixed phase order — the single source of truth shared by the stepper (client)
 * and the state machine (server). CONTACT_INFO is an informational pre-step; new
 * pipelines start at DISCOVERY.
 */
export const PHASE_ORDER: PhaseType[] = [
  PhaseType.CONTACT_INFO,
  PhaseType.DISCOVERY,
  PhaseType.BUSINESS_UNDERSTANDING,
  PhaseType.REQUIREMENT,
  PhaseType.QUOTATION,
  PhaseType.PROJECT_MANAGEMENT,
];

/** Operational pipeline phases. CONTACT_INFO is business-level, not stepped. */
export const WORKABLE_PHASES: PhaseType[] = PHASE_ORDER.filter(
  (phase) => phase !== PhaseType.CONTACT_INFO,
);

export const PHASE_LABELS: Record<PhaseType, string> = {
  CONTACT_INFO: "Contact Info",
  DISCOVERY: "Discovery",
  BUSINESS_UNDERSTANDING: "Business Understanding",
  REQUIREMENT: "Requirement",
  QUOTATION: "Quotation",
  PROJECT_MANAGEMENT: "Project Management",
};

export const LEAD_SOURCE_ORDER: LeadSource[] = [
  LeadSource.WEBSITE,
  LeadSource.INSTAGRAM,
  LeadSource.LINKEDIN,
  LeadSource.REFERRAL,
  LeadSource.DIRECT,
  LeadSource.COLD,
  LeadSource.MANUAL_RESEARCH,
  LeadSource.OTHER,
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referral",
  DIRECT: "Direct",
  COLD: "Cold Outreach",
  MANUAL_RESEARCH: "Manual Research",
  OTHER: "Other",
};

export const PIPELINE_STATUS_OPTIONS: PipelineStatus[] = [
  PipelineStatus.ACTIVE,
  PipelineStatus.DEACTIVATED,
  PipelineStatus.COMPLETED,
];

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  ACTIVE: "Active",
  DEACTIVATED: "Deactivated",
  COMPLETED: "Completed",
};

/** The phase immediately after `type` in the fixed order, or null at the end. */
export function nextPhase(type: PhaseType): PhaseType | null {
  const index = PHASE_ORDER.indexOf(type);
  if (index < 0 || index === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[index + 1] ?? null;
}

/** True when the pipeline has reached the last phase in the fixed order. */
export function isFinalPhase(type: PhaseType): boolean {
  return nextPhase(type) === null;
}

/** Pipelines that may be deactivated through the standard close flow. */
export function canDeactivatePipeline(status: PipelineStatus): boolean {
  return status === PipelineStatus.ACTIVE || status === PipelineStatus.COMPLETED;
}

/** Whether an active pipeline at the final phase can be marked completed (won). */
export function canCompletePipeline(params: {
  status: PipelineStatus;
  currentPhase: PhaseType;
  handedOff: boolean;
}): boolean {
  return (
    params.status === PipelineStatus.ACTIVE &&
    isFinalPhase(params.currentPhase) &&
    params.handedOff
  );
}

/** Hide / reject deactivation once the pipeline is in the final phase or handed to delivery. */
export function isPipelineDeactivationLocked(params: {
  currentPhase: PhaseType;
  handedOff: boolean;
  scope?: "ui" | "api";
}): boolean {
  if (params.handedOff) return true;
  if (params.scope === "api") return false;
  return isFinalPhase(params.currentPhase);
}
