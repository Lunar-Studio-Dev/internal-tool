import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProjectSetupContext } from "@/features/projects/server/projects.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidatePipelines } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type ProjectSetupDto = Jsonify<ProjectSetupContext>;
export type MutationOk = { warning?: string; id?: string };

export const projectQueries = {
  setup: (pipelineId: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.project(pipelineId),
      queryFn: ({ signal }) =>
        api<ProjectSetupDto>(`/api/pipelines/${pipelineId}/project`, { signal }),
      enabled: Boolean(pipelineId),
    }),
};

export function useCreateProject(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/project`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await Promise.all([
        invalidatePipelines(queryClient),
        queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.project(pipelineId) }),
      ]);
    },
  });
}
