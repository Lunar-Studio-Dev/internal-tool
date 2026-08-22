import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addDeactivationReasonAction,
  setDeactivationReasonEnabledAction,
  updateDeactivationReasonAction,
  updateSettingsAction,
} from "@/features/settings/server/settings.actions";
import type { AppSettingsDto } from "@/lib/app-settings";
import type { DeactivationReasonAdmin } from "@/features/settings/server/settings.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateSettings } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type SettingsDataDto = {
  settings: Jsonify<AppSettingsDto>;
  deactivationReasons: Jsonify<DeactivationReasonAdmin[]>;
};

export const settingsQueries = {
  data: () =>
    queryOptions({
      queryKey: queryKeys.settings.data(),
      queryFn: ({ signal }) => api<SettingsDataDto>("/api/settings", { signal }),
    }),
};

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettingsAction,
    onSuccess: (result) => {
      if (result.ok) invalidateSettings(queryClient);
    },
  });
}

export function useAddDeactivationReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDeactivationReasonAction,
    onSuccess: (result) => {
      if (result.ok) invalidateSettings(queryClient);
    },
  });
}

export function useUpdateDeactivationReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      updateDeactivationReasonAction(id, { label }),
    onSuccess: (result) => {
      if (result.ok) invalidateSettings(queryClient);
    },
  });
}

export function useSetDeactivationReasonEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setDeactivationReasonEnabledAction(id, enabled),
    onSuccess: (result) => {
      if (result.ok) invalidateSettings(queryClient);
    },
  });
}
