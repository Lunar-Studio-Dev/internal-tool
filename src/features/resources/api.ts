import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { ResourceItem, ResourceOptions } from "@/features/resources/server/resources.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateResources } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type ResourceDto = Jsonify<ResourceItem>;
export type ResourceOptionsDto = Jsonify<ResourceOptions>;
export type MutationOk = { warning?: string; id?: string };

export const resourceQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.resources.list(),
      queryFn: ({ signal }) => api<ResourceDto[]>("/api/resources", { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.resources.detail(id),
      queryFn: ({ signal }) => api<ResourceDto>(`/api/resources/${id}`, { signal }),
    }),
  options: () =>
    queryOptions({
      queryKey: queryKeys.resources.options(),
      queryFn: ({ signal }) => api<ResourceOptionsDto>("/api/resources/options", { signal }),
    }),
};

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>("/api/resources", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateResources(queryClient),
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<MutationOk>(`/api/resources/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateResources(queryClient),
  });
}
