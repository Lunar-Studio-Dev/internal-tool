import { isFinalPhase } from "@/features/pipelines/constants";
import type { ClientDecision, PhaseType, PipelineStatus } from "@/generated/prisma/enums";

export type BusinessPipelineRow = {
  id: string;
  code: string;
  name: string;
  currentPhase: PhaseType;
  status: PipelineStatus;
  ownerName: string | null;
  createdAt: string;
  decision: ClientDecision | null;
  handedOff: boolean;
  quotationSubtotal: number | null;
};

export type BusinessPipelineMetrics = {
  active: number;
  deactivated: number;
  inProgress: number;
  totalValuePaise: number;
  activeHint: string | null;
  deactivatedHint: string | null;
  inProgressHint: string | null;
  valueHint: string | null;
};

export function computeBusinessPipelineMetrics(
  pipelines: BusinessPipelineRow[],
): BusinessPipelineMetrics {
  const active = pipelines.filter((p) => p.status === "ACTIVE");
  const deactivated = pipelines.filter((p) => p.status === "DEACTIVATED");
  const inProgress = active.filter((p) => !isFinalPhase(p.currentPhase) && !p.handedOff);

  const valued = pipelines.filter(
    (p) =>
      p.quotationSubtotal != null &&
      p.quotationSubtotal > 0 &&
      (p.status === "ACTIVE" || p.decision === "ACCEPTED"),
  );
  const totalValuePaise = valued.reduce((sum, p) => sum + (p.quotationSubtotal ?? 0), 0);

  return {
    active: active.length,
    deactivated: deactivated.length,
    inProgress: inProgress.length,
    totalValuePaise,
    activeHint: active[0] ? `${active[0].code} · ${active[0].name}` : "No active pipelines",
    deactivatedHint:
      deactivated.length > 0
        ? `${deactivated.length} deactivated`
        : "None deactivated",
    inProgressHint: inProgress[0]?.name ?? (active.length ? "All at final phase" : null),
    valueHint:
      valued.length > 0
        ? `Across ${valued.length} pipeline${valued.length === 1 ? "" : "s"}`
        : "No quoted value yet",
  };
}

export type BusinessPipelineFilter =
  | "all"
  | "active"
  | "deactivated"
  | "in_progress"
  | "handed_off";

export function filterBusinessPipelines(
  pipelines: BusinessPipelineRow[],
  filter: BusinessPipelineFilter,
): BusinessPipelineRow[] {
  switch (filter) {
    case "active":
      return pipelines.filter((p) => p.status === "ACTIVE");
    case "deactivated":
      return pipelines.filter((p) => p.status === "DEACTIVATED");
    case "in_progress":
      return pipelines.filter(
        (p) => p.status === "ACTIVE" && !isFinalPhase(p.currentPhase) && !p.handedOff,
      );
    case "handed_off":
      return pipelines.filter((p) => p.handedOff);
    default:
      return pipelines;
  }
}
