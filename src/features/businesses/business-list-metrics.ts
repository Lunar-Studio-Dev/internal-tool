export type BusinessListRow = {
  id: string;
  name: string;
  website: string;
  industry: string;
  primaryContact: string;
  pipelineCount: number;
  activePipelineCount: number;
};

export type BusinessListMetrics = {
  total: number;
  withPipelines: number;
  withoutPipelines: number;
  totalPipelines: number;
  activePipelines: number;
  withPipelinesHint: string | null;
  activeHint: string | null;
};

export function computeBusinessListMetrics(businesses: BusinessListRow[]): BusinessListMetrics {
  const withPipelines = businesses.filter((b) => b.pipelineCount > 0);
  const withoutPipelines = businesses.length - withPipelines.length;
  const totalPipelines = businesses.reduce((sum, b) => sum + b.pipelineCount, 0);
  const activePipelines = businesses.reduce((sum, b) => sum + b.activePipelineCount, 0);
  const withActive = businesses.filter((b) => b.activePipelineCount > 0);

  return {
    total: businesses.length,
    withPipelines: withPipelines.length,
    withoutPipelines,
    totalPipelines,
    activePipelines,
    withPipelinesHint:
      withoutPipelines > 0
        ? `${withoutPipelines} without pipelines`
        : "All have pipelines",
    activeHint: withActive[0]
      ? `${withActive.length} client${withActive.length === 1 ? "" : "s"} with live work`
      : "No active opportunities",
  };
}

export type BusinessListFilter = "all" | "with_pipelines" | "with_active";

export function filterBusinessList<T extends BusinessListRow>(
  businesses: T[],
  filter: BusinessListFilter,
): T[] {
  switch (filter) {
    case "with_pipelines":
      return businesses.filter((b) => b.pipelineCount > 0);
    case "with_active":
      return businesses.filter((b) => b.activePipelineCount > 0);
    default:
      return businesses;
  }
}
