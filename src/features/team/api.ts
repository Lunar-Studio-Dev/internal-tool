import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { MemberDetail, MemberListItem, MemberWorkload } from "@/features/team/server/team.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateTeam } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import type { MemberStatus, RoleName } from "@/generated/prisma/enums";

export type TeamMemberDto = Jsonify<MemberListItem>;
export type TeamMemberDetailDto = Jsonify<MemberDetail>;
export type MemberWorkloadDto = Jsonify<MemberWorkload>;
export type MutationOk = { warning?: string; id?: string };

export type MemberWriteInput = {
  name: string;
  email: string;
  phone?: string;
  roles: RoleName[];
};

export const teamQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.team.list(),
      queryFn: ({ signal }) => api<TeamMemberDto[]>("/api/team", { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.team.detail(id),
      queryFn: ({ signal }) => api<TeamMemberDetailDto>(`/api/team/${id}`, { signal }),
      enabled: Boolean(id),
    }),
  workload: (id: string) =>
    queryOptions({
      queryKey: queryKeys.team.workload(id),
      queryFn: ({ signal }) => api<MemberWorkloadDto>(`/api/team/${id}/workload`, { signal }),
      enabled: Boolean(id),
    }),
};

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberWriteInput) =>
      api<MutationOk>("/api/team", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateTeam(queryClient),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberWriteInput & { id: string }) =>
      api<MutationOk>(`/api/team/${input.id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => invalidateTeam(queryClient),
  });
}

export function useSetMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberStatus }) =>
      api<MutationOk>(`/api/team/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
    onSuccess: () => invalidateTeam(queryClient),
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<MutationOk>(`/api/team/${id}/resend-invite`, { method: "POST" }),
    onSuccess: () => invalidateTeam(queryClient),
  });
}
