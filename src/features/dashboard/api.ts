import { queryOptions } from "@tanstack/react-query";

import type { getDashboardData } from "@/features/dashboard/server/dashboard.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export type DashboardDataDto = Jsonify<Awaited<ReturnType<typeof getDashboardData>>>;

export const dashboardQueries = {
  data: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.data(),
      queryFn: ({ signal }) => api<DashboardDataDto>("/api/dashboard", { signal }),
    }),
};
