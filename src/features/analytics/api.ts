import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export type AnalyticsPeriod = "monthly" | "quarterly" | "yearly";

export const analyticsQueries = {
  tab: (tab: string, period: AnalyticsPeriod = "monthly") =>
    queryOptions({
      queryKey: queryKeys.analytics.tab(tab, period),
      queryFn: ({ signal }) =>
        api<Record<string, unknown>>(
          `/api/analytics?tab=${encodeURIComponent(tab)}&period=${period}`,
          { signal },
        ),
    }),
};
