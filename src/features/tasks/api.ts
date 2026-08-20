import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { TaskDetailItem, TaskItem, TaskOptions } from "@/features/tasks/server/tasks.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateTasks } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type TaskDto = Jsonify<TaskItem>;
export type TaskDetailDto = Jsonify<TaskDetailItem>;
export type TaskOptionsDto = Jsonify<TaskOptions>;
export type MutationOk = { warning?: string; id?: string };

export const taskQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.tasks.list(),
      queryFn: ({ signal }) => api<TaskDto[]>("/api/tasks", { signal }),
    }),
  options: () =>
    queryOptions({
      queryKey: queryKeys.tasks.options(),
      queryFn: ({ signal }) => api<TaskOptionsDto>("/api/tasks/options", { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.tasks.detail(id),
      queryFn: ({ signal }) => api<TaskDetailDto>(`/api/tasks/${id}`, { signal }),
      enabled: Boolean(id),
    }),
};

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateTasks(queryClient),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Record<string, unknown>) =>
      api<MutationOk>(`/api/tasks/${input.id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => invalidateTasks(queryClient),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<MutationOk>(`/api/tasks/${id}/complete`, { method: "POST" }),
    onSuccess: () => invalidateTasks(queryClient),
  });
}

export function useCancelTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<MutationOk>(`/api/tasks/${id}/cancel`, { method: "POST" }),
    onSuccess: () => invalidateTasks(queryClient),
  });
}

export function useReassignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; assigneeId: string }) =>
      api<MutationOk>(`/api/tasks/${input.id}/reassign`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateTasks(queryClient),
  });
}
