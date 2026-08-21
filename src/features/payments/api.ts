import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { PaymentItem, PaymentStatus } from "@/features/payments/server/payments.queries";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateAccounts, invalidateBusinesses, invalidatePipelines } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type PaymentStatusDto = Jsonify<PaymentStatus>;
export type PaymentItemDto = Jsonify<PaymentItem>;
export type RecordPaymentResult = {
  id?: string;
  promoted?: boolean;
  fullyPaid?: boolean;
  warning?: string;
};

async function invalidatePaymentWrites(
  queryClient: ReturnType<typeof useQueryClient>,
  pipelineId: string,
) {
  await Promise.all([
    invalidatePipelines(queryClient),
    invalidateBusinesses(queryClient),
    invalidateAccounts(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.payments(pipelineId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.paymentStatus(pipelineId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.phases(pipelineId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.decision(pipelineId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.project(pipelineId) }),
  ]);
}

export const paymentQueries = {
  status: (pipelineId: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.paymentStatus(pipelineId),
      queryFn: ({ signal }) =>
        api<PaymentStatusDto>(`/api/pipelines/${pipelineId}/payments/status`, { signal }),
      enabled: Boolean(pipelineId),
    }),
  list: (pipelineId: string) =>
    queryOptions({
      queryKey: queryKeys.pipelines.payments(pipelineId),
      queryFn: ({ signal }) =>
        api<PaymentItemDto[]>(`/api/pipelines/${pipelineId}/payments`, { signal }),
      enabled: Boolean(pipelineId),
    }),
};

export function useRecordPayment(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) =>
      api<RecordPaymentResult>(`/api/pipelines/${pipelineId}/payments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidatePaymentWrites(queryClient, pipelineId),
  });
}
