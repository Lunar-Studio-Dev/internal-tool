import { queryOptions } from "@tanstack/react-query";

import type { SearchResultItem } from "@/features/search/server/search.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export type SearchResultDto = Jsonify<SearchResultItem>;

export const searchQueries = {
  query: (q: string) =>
    queryOptions({
      queryKey: queryKeys.search.query(q),
      queryFn: ({ signal }) =>
        api<SearchResultDto[]>(`/api/search?q=${encodeURIComponent(q)}`, { signal }),
      enabled: q.trim().length >= 2,
    }),
};
