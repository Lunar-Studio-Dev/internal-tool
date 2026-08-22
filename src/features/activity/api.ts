import { queryOptions } from "@tanstack/react-query";

import type { getActivityTimelinePage } from "@/features/activity/server/activity.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export type ActivityTimelineDto = Jsonify<Awaited<ReturnType<typeof getActivityTimelinePage>>>;

export type ActivityFilters = {
  cursor?: string;
  businessId?: string;
  pipelineId?: string;
  actorId?: string;
};

function filtersToParams(filters: ActivityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.businessId) params.set("businessId", filters.businessId);
  if (filters.pipelineId) params.set("pipelineId", filters.pipelineId);
  if (filters.actorId) params.set("actorId", filters.actorId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const activityQueries = {
  timeline: (filters: ActivityFilters = {}) =>
    queryOptions({
      queryKey: queryKeys.activity.timeline(filters),
      queryFn: ({ signal }) =>
        api<ActivityTimelineDto>(`/api/activity${filtersToParams(filters)}`, { signal }),
    }),
};
