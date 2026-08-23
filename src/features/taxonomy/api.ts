import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { TaxonomyItem } from "@/features/taxonomy/server/taxonomy.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export type TaxonomyDto = Jsonify<TaxonomyItem>;
export type SourceCategoryDto = Jsonify<{
  id: string;
  name: string;
  allowsSubcategories: boolean;
}>;
export type SourceSubCategoryDto = Jsonify<{
  id: string;
  name: string;
  sourceCategoryId: string;
  parentId: string | null;
}>;

type CreateTaxonomyResult = { id: string; name: string };

function taxonomyListQuery(key: readonly string[], path: string, params?: Record<string, string>) {
  const search = params ? `?${new URLSearchParams(params)}` : "";
  return queryOptions({
    queryKey: key,
    queryFn: ({ signal }) => api<TaxonomyDto[]>(`${path}${search}`, { signal }),
  });
}

export const taxonomyQueries = {
  sourceCategories: () =>
    queryOptions({
      queryKey: queryKeys.taxonomy.sourceCategories(),
      queryFn: ({ signal }) =>
        api<SourceCategoryDto[]>("/api/taxonomy/source-categories", { signal }),
    }),
  sourceSubCategories: (sourceCategoryId?: string) =>
    queryOptions({
      queryKey: queryKeys.taxonomy.sourceSubCategories(sourceCategoryId),
      queryFn: ({ signal }) => {
        const q = sourceCategoryId ? `?sourceCategoryId=${encodeURIComponent(sourceCategoryId)}` : "";
        return api<SourceSubCategoryDto[]>(`/api/taxonomy/source-subcategories${q}`, { signal });
      },
    }),
  sectors: () => taxonomyListQuery(queryKeys.taxonomy.sectors(), "/api/taxonomy/sectors"),
  industries: (sectorId?: string) =>
    taxonomyListQuery(
      queryKeys.taxonomy.industries(sectorId),
      "/api/taxonomy/industries",
      sectorId ? { sectorId } : undefined,
    ),
  markets: () => taxonomyListQuery(queryKeys.taxonomy.markets(), "/api/taxonomy/markets"),
  locations: () => taxonomyListQuery(queryKeys.taxonomy.locations(), "/api/taxonomy/locations"),
  tags: () => taxonomyListQuery(queryKeys.taxonomy.tags(), "/api/taxonomy/tags"),
};

function useCreateTaxonomy(path: string, invalidate: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<CreateTaxonomyResult>(path, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all });
    },
  });
}

export function useCreateSector() {
  const queryClient = useQueryClient();
  return useCreateTaxonomy("/api/taxonomy/sectors", () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.sectors() }),
  );
}

export function useCreateIndustry() {
  const queryClient = useQueryClient();
  return useCreateTaxonomy("/api/taxonomy/industries", () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.industries() }),
  );
}

export function useCreateMarket() {
  const queryClient = useQueryClient();
  return useCreateTaxonomy("/api/taxonomy/markets", () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.markets() }),
  );
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useCreateTaxonomy("/api/taxonomy/locations", () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.locations() }),
  );
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useCreateTaxonomy("/api/taxonomy/tags", () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() }),
  );
}

export function useCreateSourceSubCategory() {
  const queryClient = useQueryClient();
  return useCreateTaxonomy("/api/taxonomy/source-subcategories", () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.sourceSubCategories() }),
  );
}
