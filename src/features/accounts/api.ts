import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  AccountsFormOptions,
  FinanceSummary,
  MonthlyAmount,
  MonthlyComparison,
  OutstandingItem,
  TransactionListItem,
} from "@/features/accounts/server/accounts.queries";
import { TransactionType } from "@/generated/prisma/enums";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateAccounts, invalidateBusinesses } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";

export type FinanceSummaryDto = Jsonify<FinanceSummary>;
export type TransactionListItemDto = Jsonify<TransactionListItem>;
export type OutstandingItemDto = Jsonify<OutstandingItem>;
export type MonthlyAmountDto = Jsonify<MonthlyAmount>;
export type MonthlyComparisonDto = Jsonify<MonthlyComparison>;
export type AccountsFormOptionsDto = Jsonify<AccountsFormOptions>;

export type TransactionFilters = {
  type?: TransactionType | "ALL";
  businessId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

function filtersToParams(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== "ALL") params.set("type", filters.type);
  if (filters.businessId) params.set("businessId", filters.businessId);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const accountQueries = {
  summary: () =>
    queryOptions({
      queryKey: queryKeys.accounts.summary(),
      queryFn: ({ signal }) => api<FinanceSummaryDto>("/api/accounts/summary", { signal }),
    }),
  transactions: (filters: TransactionFilters = {}) =>
    queryOptions({
      queryKey: queryKeys.accounts.transactions(filters as Record<string, string | undefined>),
      queryFn: ({ signal }) =>
        api<TransactionListItemDto[]>(
          `/api/accounts/transactions${filtersToParams(filters)}`,
          { signal },
        ),
    }),
  recentTransactions: () =>
    queryOptions({
      queryKey: [...queryKeys.accounts.all, "recent-transactions"] as const,
      queryFn: ({ signal }) =>
        api<TransactionListItemDto[]>("/api/accounts/transactions?recent=1", { signal }),
    }),
  outstanding: () =>
    queryOptions({
      queryKey: queryKeys.accounts.outstanding(),
      queryFn: ({ signal }) => api<OutstandingItemDto[]>("/api/accounts/outstanding", { signal }),
    }),
  revenueByMonth: () =>
    queryOptions({
      queryKey: queryKeys.accounts.revenueByMonth(),
      queryFn: ({ signal }) =>
        api<MonthlyAmountDto[]>("/api/accounts/charts", { signal }),
    }),
  earningsVsExpenses: () =>
    queryOptions({
      queryKey: queryKeys.accounts.earningsVsExpenses(),
      queryFn: ({ signal }) =>
        api<MonthlyComparisonDto[]>("/api/accounts/charts?chart=earnings-vs-expenses", {
          signal,
        }),
    }),
  options: () =>
    queryOptions({
      queryKey: queryKeys.accounts.options(),
      queryFn: ({ signal }) => api<AccountsFormOptionsDto>("/api/accounts/options", { signal }),
    }),
};

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: unknown) => {
      const result = await api<{ id: string }>("/api/accounts/transactions", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await Promise.all([
        invalidateAccounts(queryClient),
        invalidateBusinesses(queryClient),
      ]);
      return result;
    },
  });
}
