import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { FollowUpItem } from "@/features/followups/server/followups.queries";
import type {
  PipelineActivityItem,
  PipelineDetail,
  PipelineListItem,
} from "@/features/pipelines/server/pipelines.queries";
import type { ResourceItem } from "@/features/resources/server/resources.queries";
import type { TaskItem } from "@/features/tasks/server/tasks.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateBusinesses, invalidatePipelines } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type PipelineListDto = Jsonify<PipelineListItem>;
export type PipelineDetailDto = Jsonify<PipelineDetail>;
export type PipelineActivityDto = Jsonify<PipelineActivityItem>;
export type MutationOk = { warning?: string; id?: string };

export type PipelineCreateOptions = {
  businesses: Array<{ id: string; name: string; website: string | null }>;
  assignees: Array<{ id: string; name: string }>;
};

export type DeactivationReasonDto = { id: string; label: string; enabled: boolean; usageCount: number };

async function invalidatePipelineWrites(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([invalidatePipelines(queryClient), invalidateBusinesses(queryClient)]);
}

export const pipelineQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.pipelines.list(),
      queryFn: ({ signal }) => api<PipelineListDto[]>("/api/pipelines", { signal }),
    }),
  options: () =>
    queryOptions({
      queryKey: queryKeys.pipelines.options(),
      queryFn: ({ signal }) => api<PipelineCreateOptions>("/api/pipelines/options", { signal }),
    }),
  reasons: () =>
    queryOptions({
      queryKey: queryKeys.pipelines.reasons(),
      queryFn: ({ signal }) => api<DeactivationReasonDto[]>("/api/deactivation-reasons", { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.detail(id),
      queryFn: ({ signal }) => api<PipelineDetailDto>(`/api/pipelines/${id}`, { signal }),
      enabled: Boolean(id),
    }),
  activity: (id: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.activity(id),
      queryFn: ({ signal }) =>
        api<PipelineActivityDto[]>(`/api/pipelines/${id}/activity`, { signal }),
      enabled: Boolean(id),
    }),
  followUps: (id: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.followUps(id),
      queryFn: ({ signal }) =>
        api<Jsonify<FollowUpItem>[]>(`/api/pipelines/${id}/follow-ups`, { signal }),
      enabled: Boolean(id),
    }),
  tasks: (id: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.tasks(id),
      queryFn: ({ signal }) => api<Jsonify<TaskItem>[]>(`/api/pipelines/${id}/tasks`, { signal }),
      enabled: Boolean(id),
    }),
  resources: (id: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.resources(id),
      queryFn: ({ signal }) =>
        api<Jsonify<ResourceItem>[]>(`/api/pipelines/${id}/resources`, { signal }),
      enabled: Boolean(id),
    }),
};

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>("/api/pipelines", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidatePipelineWrites(queryClient),
  });
}

export function usePromotePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, notes }: { pipelineId: string; notes?: string }) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/promote`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => invalidatePipelineWrites(queryClient),
  });
}

export function useDeactivatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { pipelineId: string; reasonId: string; notes?: string }) =>
      api<MutationOk>(`/api/pipelines/${input.pipelineId}/deactivate`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePipelineWrites(queryClient),
  });
}

export function useReactivatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { pipelineId: string; notes?: string }) =>
      api<MutationOk>(`/api/pipelines/${input.pipelineId}/reactivate`, {
        method: "POST",
        body: JSON.stringify({ notes: input.notes }),
      }),
    onSuccess: () => invalidatePipelineWrites(queryClient),
  });
}

export function useCompletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pipelineId: string; notes?: string }) => {
      const result = await api<MutationOk>(`/api/pipelines/${input.pipelineId}/complete`, {
        method: "POST",
        body: JSON.stringify({ notes: input.notes }),
      });
      await Promise.all([
        invalidatePipelineWrites(queryClient),
        queryClient.refetchQueries({ queryKey: queryKeys.pipelines.detail(input.pipelineId) }),
      ]);
      return result;
    },
  });
}
