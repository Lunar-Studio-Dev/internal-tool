import { isFinalPhase } from "@/features/pipelines/constants";
import type { PhaseType, PipelineStatus } from "@/generated/prisma/enums";

export type PipelineListRow = {
  id: string;
  code: string;
  name: string;
  currentPhase: PhaseType;
  status: PipelineStatus;
  assigneeNames: string[];
};

export type PipelineListMetrics = {
  total: number;
  active: number;
  inProgress: number;
  completed: number;
  deactivated: number;
  activeHint: string | null;
  inProgressHint: string | null;
};

export function computePipelineListMetrics(pipelines: PipelineListRow[]): PipelineListMetrics {
  const active = pipelines.filter((p) => p.status === "ACTIVE");
  const inProgress = active.filter((p) => !isFinalPhase(p.currentPhase));
  const completed = pipelines.filter((p) => p.status === "COMPLETED");
  const deactivated = pipelines.filter((p) => p.status === "DEACTIVATED");

  return {
    total: pipelines.length,
    active: active.length,
    inProgress: inProgress.length,
    completed: completed.length,
    deactivated: deactivated.length,
    activeHint: active[0] ? `${active[0].code} · ${active[0].name}` : "No active pipelines",
    inProgressHint: inProgress[0]?.name ?? (active.length ? "All at final phase" : null),
  };
}

export type PipelineListFilter = "all" | "active" | "in_progress" | "completed" | "deactivated";

export function filterPipelineList<T extends PipelineListRow>(
  pipelines: T[],
  filter: PipelineListFilter,
): T[] {
  switch (filter) {
    case "active":
      return pipelines.filter((p) => p.status === "ACTIVE");
    case "in_progress":
      return pipelines.filter((p) => p.status === "ACTIVE" && !isFinalPhase(p.currentPhase));
    case "completed":
      return pipelines.filter((p) => p.status === "COMPLETED");
    case "deactivated":
      return pipelines.filter((p) => p.status === "DEACTIVATED");
    default:
      return pipelines;
  }
}

export function pipelineListFilterToStatus(filter: PipelineListFilter): PipelineStatus | "ALL" {
  if (filter === "active" || filter === "in_progress") return "ACTIVE";
  if (filter === "completed") return "COMPLETED";
  if (filter === "deactivated") return "DEACTIVATED";
  return "ALL";
}
