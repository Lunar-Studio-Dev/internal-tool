import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BusinessActivityItem,
  BusinessDetail,
  BusinessListItem,
} from "@/features/businesses/server/businesses.queries";
import type { ResourceItem } from "@/features/resources/server/resources.queries";
import type { TaskItem } from "@/features/tasks/server/tasks.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateBusinesses } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type BusinessListDto = Jsonify<BusinessListItem>;
export type BusinessDetailDto = Jsonify<BusinessDetail>;
export type BusinessActivityDto = Jsonify<BusinessActivityItem>;
export type MutationOk = { warning?: string; id?: string };

export const businessQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.businesses.list(),
      queryFn: ({ signal }) => api<BusinessListDto[]>("/api/businesses", { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.businesses.detail(id),
      queryFn: ({ signal }) => api<BusinessDetailDto>(`/api/businesses/${id}`, { signal }),
      enabled: Boolean(id),
    }),
  activity: (id: string) =>
    queryOptions({
      queryKey: queryKeys.businesses.activity(id),
      queryFn: ({ signal }) =>
        api<BusinessActivityDto[]>(`/api/businesses/${id}/activity`, { signal }),
      enabled: Boolean(id),
    }),
  tasks: (id: string) =>
    queryOptions({
      queryKey: queryKeys.businesses.tasks(id),
      queryFn: ({ signal }) => api<Jsonify<TaskItem>[]>(`/api/businesses/${id}/tasks`, { signal }),
      enabled: Boolean(id),
    }),
  resources: (id: string) =>
    queryOptions({
      queryKey: queryKeys.businesses.resources(id),
      queryFn: ({ signal }) =>
        api<Jsonify<ResourceItem>[]>(`/api/businesses/${id}/resources`, { signal }),
      enabled: Boolean(id),
    }),
};

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>("/api/businesses", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateBusinesses(queryClient),
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown & { id: string }) =>
      api<MutationOk>(`/api/businesses/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateBusinesses(queryClient),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { businessId: string } & Record<string, unknown>) =>
      api<MutationOk>(`/api/businesses/${input.businessId}/contacts`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateBusinesses(queryClient),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Record<string, unknown>) =>
      api<MutationOk>(`/api/contacts/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateBusinesses(queryClient),
  });
}

export function useSetPrimaryContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<MutationOk>(`/api/contacts/${id}/primary`, { method: "POST" }),
    onSuccess: () => invalidateBusinesses(queryClient),
  });
}
