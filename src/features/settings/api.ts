import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

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

export const settingsQueries = {
  data: () =>
    queryOptions({
      queryKey: queryKeys.settings.data(),
      queryFn: ({ signal }) => api<SettingsDataDto>("/api/settings", { signal }),
    }),
};

function useSettingsMutation<T>(mutationFn: (input: T) => Promise<{ ok: boolean; error?: string }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      if (result.ok) {
        invalidateSettings(queryClient);
        queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all });
      }
    },
  });
}

export function useAddDeactivationReason() {
  return useSettingsMutation(addDeactivationReasonAction);
}

export function useUpdateDeactivationReason() {
  return useSettingsMutation(({ id, label }: { id: string; label: string }) =>
    updateDeactivationReasonAction(id, { label }),
  );
}

export function useSetDeactivationReasonEnabled() {
  return useSettingsMutation(({ id, enabled }: { id: string; enabled: boolean }) =>
    setDeactivationReasonEnabledAction(id, enabled),
  );
}

export function useCreateSourceCategory() {
  return useSettingsMutation(createSourceCategoryAdminAction);
}

export function useUpdateSourceCategory() {
  return useSettingsMutation(updateSourceCategoryAction);
}

export function useSetSourceCategoryActive() {
  return useSettingsMutation(setSourceCategoryActiveAction);
}

export function useCreateSourceSubCategory() {
  return useSettingsMutation(createSourceSubCategoryAdminAction);
}

export function useUpdateSourceSubCategory() {
  return useSettingsMutation(updateSourceSubCategoryAction);
}

export function useSetSourceSubCategoryActive() {
  return useSettingsMutation(setSourceSubCategoryActiveAction);
}

export function useCreateSector() {
  return useSettingsMutation(createSectorAdminAction);
}

export function useUpdateSector() {
  return useSettingsMutation(updateSectorAction);
}

export function useSetSectorActive() {
  return useSettingsMutation(setSectorActiveAction);
}

export function useCreateIndustry() {
  return useSettingsMutation(createIndustryAdminAction);
}

export function useUpdateIndustry() {
  return useSettingsMutation(updateIndustryAction);
}

export function useSetIndustryActive() {
  return useSettingsMutation(setIndustryActiveAction);
}

export function useCreateMarket() {
  return useSettingsMutation(createMarketAdminAction);
}

export function useUpdateMarket() {
  return useSettingsMutation(updateMarketAction);
}

export function useSetMarketActive() {
  return useSettingsMutation(setMarketActiveAction);
}

export function useCreateLocation() {
  return useSettingsMutation(createLocationAdminAction);
}

export function useUpdateLocation() {
  return useSettingsMutation(updateLocationAction);
}

export function useSetLocationActive() {
  return useSettingsMutation(setLocationActiveAction);
}

export function useCreateTag() {
  return useSettingsMutation(createTagAdminAction);
}

export function useUpdateTag() {
  return useSettingsMutation(updateTagAction);
}

export function useSetTagActive() {
  return useSettingsMutation(setTagActiveAction);
}
