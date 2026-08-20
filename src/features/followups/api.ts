import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { invalidateFollowUps } from "@/lib/query/invalidate";

export type MutationOk = { warning?: string; id?: string };

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<MutationOk>("/api/follow-ups", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateFollowUps(queryClient),
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<MutationOk>(`/api/follow-ups/${id}/complete`, { method: "POST" }),
    onSuccess: () => invalidateFollowUps(queryClient),
  });
}
