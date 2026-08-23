import { queryOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addDeactivationReasonAction,
  setDeactivationReasonEnabledAction,
  updateDeactivationReasonAction,
} from "@/features/settings/server/settings.actions";
import type { DeactivationReasonAdmin } from "@/features/settings/server/settings.queries";
import {
  createIndustryAdminAction,
  createLocationAdminAction,
  createMarketAdminAction,
  createSectorAdminAction,
  createSourceCategoryAdminAction,
  createSourceSubCategoryAdminAction,
  createTagAdminAction,
  setIndustryActiveAction,
  setLocationActiveAction,
  setMarketActiveAction,
  setSectorActiveAction,
  setSourceCategoryActiveAction,
  setSourceSubCategoryActiveAction,
  setTagActiveAction,
  updateIndustryAction,
  updateLocationAction,
  updateMarketAction,
  updateSectorAction,
  updateSourceCategoryAction,
  updateSourceSubCategoryAction,
  updateTagAction,
} from "@/features/settings/server/taxonomy-admin.actions";
import type { TaxonomyAdminData } from "@/features/taxonomy/server/taxonomy.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateSettings } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type SettingsDataDto = {
  deactivationReasons: Jsonify<DeactivationReasonAdmin[]>;
  taxonomy: Jsonify<TaxonomyAdminData>;
};

type TaxonomyKey = keyof SettingsDataDto["taxonomy"];

export const settingsQueries = {
  data: () =>
    queryOptions({
      queryKey: queryKeys.settings.data(),
      queryFn: ({ signal }) => api<SettingsDataDto>("/api/settings", { signal }),
    }),
};

type SettingsSnapshot = SettingsDataDto | undefined;

function getSettingsCache(queryClient: QueryClient): SettingsSnapshot {
  return queryClient.getQueryData<SettingsDataDto>(queryKeys.settings.data());
}

function setSettingsCache(queryClient: QueryClient, data: SettingsDataDto) {
  queryClient.setQueryData(queryKeys.settings.data(), data);
}

function patchTaxonomyItem(
  queryClient: QueryClient,
  key: TaxonomyKey,
  id: string,
  patch: Record<string, unknown>,
): SettingsSnapshot {
  const previous = getSettingsCache(queryClient);
  if (!previous) return previous;

  const list = previous.taxonomy[key] as Array<{ id: string }>;
  setSettingsCache(queryClient, {
    ...previous,
    taxonomy: {
      ...previous.taxonomy,
      [key]: list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    },
  });
  return previous;
}

function patchDeactivationReason(
  queryClient: QueryClient,
  id: string,
  patch: Partial<{ label: string; enabled: boolean }>,
): SettingsSnapshot {
  const previous = getSettingsCache(queryClient);
  if (!previous) return previous;

  setSettingsCache(queryClient, {
    ...previous,
    deactivationReasons: previous.deactivationReasons.map((r) =>
      r.id === id ? { ...r, ...patch } : r,
    ),
  });
  return previous;
}

function restoreSnapshot(queryClient: QueryClient, snapshot: SettingsSnapshot) {
  if (snapshot !== undefined) {
    setSettingsCache(queryClient, snapshot);
  }
}

type MutationResult = { ok: boolean; error?: string };

type OptimisticConfig<T> = {
  onOptimistic?: (queryClient: QueryClient, variables: T) => SettingsSnapshot;
  reconcile?: boolean;
};

function useSettingsMutation<T>(
  mutationFn: (input: T) => Promise<MutationResult>,
  config: OptimisticConfig<T> = {},
) {
  const queryClient = useQueryClient();
  const { onOptimistic, reconcile = true } = config;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (!onOptimistic) return undefined;
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.data() });
      return { previous: onOptimistic(queryClient, variables) };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        restoreSnapshot(queryClient, context.previous);
      }
      toast.error("Could not save. Changes were reverted.");
    },
    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous !== undefined) {
          restoreSnapshot(queryClient, context.previous);
        }
        toast.error(result.error ?? "Could not save. Changes were reverted.");
        return;
      }
      if (!onOptimistic || reconcile) {
        void invalidateSettings(queryClient);
        void queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all });
      }
    },
  });
}

/** Pending item id from an in-flight mutation (for row spinner). */
export function pendingMutationId(mutation: {
  isPending: boolean;
  variables?: { id?: string } | null;
}): string | null {
  return mutation.isPending && mutation.variables?.id ? mutation.variables.id : null;
}

// ─── Deactivation reasons ───────────────────────────────────────────────────

export function useAddDeactivationReason() {
  return useSettingsMutation((input: { label: string }) => addDeactivationReasonAction(input));
}

export function useUpdateDeactivationReason() {
  return useSettingsMutation(
    (input: { id: string; label: string }) => updateDeactivationReasonAction(input.id, { label: input.label }),
    {
      onOptimistic: (qc, { id, label }) => patchDeactivationReason(qc, id, { label }),
    },
  );
}

export function useSetDeactivationReasonEnabled() {
  return useSettingsMutation(
    (input: { id: string; enabled: boolean }) =>
      setDeactivationReasonEnabledAction(input.id, input.enabled),
    {
      onOptimistic: (qc, { id, enabled }) => patchDeactivationReason(qc, id, { enabled }),
    },
  );
}

// ─── Source categories ──────────────────────────────────────────────────────

export function useCreateSourceCategory() {
  return useSettingsMutation((input: { name: string }) => createSourceCategoryAdminAction(input));
}

export function useUpdateSourceCategory() {
  return useSettingsMutation(
    (input: { id: string; name: string; allowsSubcategories?: boolean }) =>
      updateSourceCategoryAction(input),
    {
      onOptimistic: (qc, { id, name, allowsSubcategories }) =>
        patchTaxonomyItem(qc, "sourceCategories", id, {
          name,
          ...(allowsSubcategories !== undefined ? { allowsSubcategories } : {}),
        }),
    },
  );
}

export function useSetSourceCategoryActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setSourceCategoryActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) =>
        patchTaxonomyItem(qc, "sourceCategories", id, { active }),
    },
  );
}

// ─── Source sub-categories ──────────────────────────────────────────────────

export function useCreateSourceSubCategory() {
  return useSettingsMutation(
    (input: { name: string; sourceCategoryId: string; parentId?: string }) =>
      createSourceSubCategoryAdminAction(input),
  );
}

export function useUpdateSourceSubCategory() {
  return useSettingsMutation(
    (input: { id: string; name: string }) => updateSourceSubCategoryAction(input),
    {
      onOptimistic: (qc, { id, name }) =>
        patchTaxonomyItem(qc, "sourceSubCategories", id, { name }),
    },
  );
}

export function useSetSourceSubCategoryActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setSourceSubCategoryActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) =>
        patchTaxonomyItem(qc, "sourceSubCategories", id, { active }),
    },
  );
}

// ─── Sectors ────────────────────────────────────────────────────────────────

export function useCreateSector() {
  return useSettingsMutation((input: { name: string }) => createSectorAdminAction(input));
}

export function useUpdateSector() {
  return useSettingsMutation(
    (input: { id: string; name: string }) => updateSectorAction(input),
    {
      onOptimistic: (qc, { id, name }) => patchTaxonomyItem(qc, "sectors", id, { name }),
    },
  );
}

export function useSetSectorActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setSectorActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) => patchTaxonomyItem(qc, "sectors", id, { active }),
    },
  );
}

// ─── Industries ─────────────────────────────────────────────────────────────

export function useCreateIndustry() {
  return useSettingsMutation(
    (input: { name: string; sectorId?: string }) => createIndustryAdminAction(input),
  );
}

export function useUpdateIndustry() {
  return useSettingsMutation(
    (input: { id: string; name: string; sectorId?: string }) => updateIndustryAction(input),
    {
      onOptimistic: (qc, { id, name, sectorId }) =>
        patchTaxonomyItem(qc, "industries", id, {
          name,
          ...(sectorId !== undefined ? { sectorId: sectorId || null } : {}),
        }),
    },
  );
}

export function useSetIndustryActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setIndustryActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) => patchTaxonomyItem(qc, "industries", id, { active }),
    },
  );
}

// ─── Markets / Locations / Tags ─────────────────────────────────────────────

export function useCreateMarket() {
  return useSettingsMutation((input: { name: string }) => createMarketAdminAction(input));
}

export function useUpdateMarket() {
  return useSettingsMutation(
    (input: { id: string; name: string }) => updateMarketAction(input),
    {
      onOptimistic: (qc, { id, name }) => patchTaxonomyItem(qc, "markets", id, { name }),
    },
  );
}

export function useSetMarketActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setMarketActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) => patchTaxonomyItem(qc, "markets", id, { active }),
    },
  );
}

export function useCreateLocation() {
  return useSettingsMutation((input: { name: string }) => createLocationAdminAction(input));
}

export function useUpdateLocation() {
  return useSettingsMutation(
    (input: { id: string; name: string }) => updateLocationAction(input),
    {
      onOptimistic: (qc, { id, name }) => patchTaxonomyItem(qc, "locations", id, { name }),
    },
  );
}

export function useSetLocationActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setLocationActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) => patchTaxonomyItem(qc, "locations", id, { active }),
    },
  );
}

export function useCreateTag() {
  return useSettingsMutation((input: { name: string }) => createTagAdminAction(input));
}

export function useUpdateTag() {
  return useSettingsMutation(
    (input: { id: string; name: string }) => updateTagAction(input),
    {
      onOptimistic: (qc, { id, name }) => patchTaxonomyItem(qc, "tags", id, { name }),
    },
  );
}

export function useSetTagActive() {
  return useSettingsMutation(
    (input: { id: string; active: boolean }) => setTagActiveAction(input),
    {
      onOptimistic: (qc, { id, active }) => patchTaxonomyItem(qc, "tags", id, { active }),
    },
  );
}
