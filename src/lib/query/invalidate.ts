import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";

export function invalidateTeam(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
}

export function invalidateBusinesses(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all });
}

export function invalidatePipelines(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all });
}

export function invalidateTasks(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.team.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.followUps.all }),
  ]);
}

export function invalidateResources(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.resources.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all }),
  ]);
}

export function invalidateFollowUps(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.followUps.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.team.all }),
  ]);
}
