import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { BusinessDetail } from "@/features/businesses/server/businesses.queries";
import type { PhasePayloads } from "@/features/phases/server/phases.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateFollowUps, invalidatePipelines } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type PhaseDataDto = Jsonify<PhasePayloads> & {
  contactInfo: Jsonify<BusinessDetail>;
};

export type QuotationDto = Jsonify<PhasePayloads["quotations"][number]>;
export type PipelineDecisionDto = Jsonify<PhasePayloads["decision"]>;
export type MutationOk = { warning?: string; id?: string; version?: number };

async function invalidatePhaseWrites(queryClient: ReturnType<typeof useQueryClient>, pipelineId: string) {
  await Promise.all([
    invalidatePipelines(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.phases(pipelineId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.quotations(pipelineId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.decision(pipelineId) }),
  ]);
}

export const phaseQueries = {
  data: (pipelineId: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.phases(pipelineId),
      queryFn: ({ signal }) => api<PhaseDataDto>(`/api/pipelines/${pipelineId}/phases`, { signal }),
      enabled: Boolean(pipelineId),
    }),
  quotations: (pipelineId: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.quotations(pipelineId),
      queryFn: ({ signal }) => api<QuotationDto[]>(`/api/pipelines/${pipelineId}/quotations`, { signal }),
      enabled: Boolean(pipelineId),
    }),
  decision: (pipelineId: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.decision(pipelineId),
      queryFn: ({ signal }) =>
        api<PipelineDecisionDto | null>(`/api/pipelines/${pipelineId}/decision`, { signal }),
      enabled: Boolean(pipelineId),
    }),
};

export function useSaveDiscovery(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/discovery`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePhaseWrites(queryClient, pipelineId),
  });
}

export function useSaveUnderstanding(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/understanding`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePhaseWrites(queryClient, pipelineId),
  });
}

export function useSaveRequirement(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/requirement`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePhaseWrites(queryClient, pipelineId),
  });
}

export function useSaveBusinessResearch(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/research`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePhaseWrites(queryClient, pipelineId),
  });
}

export function useCreateQuotation(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/quotations`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePhaseWrites(queryClient, pipelineId),
  });
}

export function useSetClientDecision(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>(`/api/pipelines/${pipelineId}/decision`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await invalidatePhaseWrites(queryClient, pipelineId);
      await invalidateFollowUps(queryClient);
    },
  });
}
