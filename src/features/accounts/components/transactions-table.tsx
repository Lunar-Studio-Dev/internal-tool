"use client";

import { format } from "date-fns";
import { ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  countActiveFilters,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { QueryGate } from "@/components/common/query-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  accountQueries,
  type TransactionFilters,
  type TransactionListItemDto,
} from "@/features/accounts/api";
import { TRANSACTION_TYPE_LABELS } from "@/features/accounts/constants";
import { TransactionDetailDialog } from "@/features/accounts/components/transaction-detail-dialog";
import { formatINR } from "@/features/phases/constants";
import { TransactionType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type TableFilters = {
  type: TransactionFilters["type"];
  businessId: string;
  fromDate: string;
  toDate: string;
};

const FILTER_DEFAULTS: TableFilters = {
  type: "ALL",
  businessId: "",
  fromDate: "",
  toDate: "",
};

export function TransactionsTable({
  fixedType,
  search: externalSearch,
  onSearchChange,
}: {
  fixedType?: TransactionType;
  search?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = externalSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const [type, setType] = useState<TransactionFilters["type"]>(fixedType ?? "ALL");
  const [businessId, setBusinessId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<TransactionListItemDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const effectiveType = fixedType ?? type;

  const filters = useMemo(
    () => ({
      type: effectiveType,
      businessId: businessId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      search: search || undefined,
    }),
    [effectiveType, businessId, fromDate, toDate, search],
  );

  const query = useQuery(accountQueries.transactions(filters));
  const optionsQuery = useQuery(accountQueries.options());

  const { draft, setDraft } = useFilterSheetDraft(
    { type: effectiveType, businessId, fromDate, toDate },
    filterOpen,
  );

  const activeFilterCount = countActiveFilters(
    { type: effectiveType, businessId, fromDate, toDate },
    { ...FILTER_DEFAULTS, type: fixedType ?? "ALL" },
  );

  const columns: DataTableColumn<TransactionListItemDto>[] = [
    {
      id: "date",
      header: "Date",
      cell: (row) => format(new Date(row.date), "d MMM yyyy"),
    },
    {
      id: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant={row.type === TransactionType.EARNING ? "secondary" : "outline"}>
          {TRANSACTION_TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {row.description ?? row.category ?? "—"}
          </p>
          {row.businessName ? (
            <p className="truncate text-xs text-muted-foreground">{row.businessName}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      headerClassName: "text-right",
      className: "text-right tabular-nums font-medium",
      cell: (row) => (
        <span
          className={cn(
            row.type === TransactionType.EARNING
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {row.type === TransactionType.EARNING ? "+" : "−"}
          {formatINR(row.amount)}
        </span>
      ),
    },
    {
      id: "action",
      header: "",
      className: "w-10",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View transaction"
          onClick={() => {
            setSelected(row);
            setDetailOpen(true);
          }}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      ),
    },
  ];

  const rows = query.data ?? [];

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<div className="h-48 animate-pulse rounded-lg bg-muted" />}
    >
      <div className="flex flex-col gap-4">
          <ListFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search transactions…"
            activeFilterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
            onApplyFilters={() => {
              if (!fixedType) setType(draft.type ?? "ALL");
              setBusinessId(draft.businessId ?? "");
              setFromDate(draft.fromDate ?? "");
              setToDate(draft.toDate ?? "");
            }}
            onResetFilters={() => {
              if (!fixedType) setType("ALL");
              setBusinessId("");
              setFromDate("");
              setToDate("");
            }}
            filterSheetContent={
              <>
                {!fixedType ? (
                  <FilterSheetSection label="Type">
                    <Select
                      value={draft.type ?? "ALL"}
                      onValueChange={(v) =>
                        setDraft((d) => ({ ...d, type: v as TransactionFilters["type"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value={TransactionType.EARNING}>Income</SelectItem>
                        <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilterSheetSection>
                ) : null}
                <FilterSheetSection label="Business">
                  <Select
                    value={draft.businessId || "__all__"}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, businessId: v === "__all__" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All businesses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All businesses</SelectItem>
                      {(optionsQuery.data?.businesses ?? []).map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterSheetSection>
                <FilterSheetSection label="From date">
                  <Input
                    type="date"
                    value={draft.fromDate ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, fromDate: e.target.value }))}
                  />
                </FilterSheetSection>
                <FilterSheetSection label="To date">
                  <Input
                    type="date"
                    value={draft.toDate ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, toDate: e.target.value }))}
                  />
                </FilterSheetSection>
              </>
            }
            desktopFilters={
              <>
                {!fixedType ? (
                  <Select
                    value={effectiveType ?? "ALL"}
                    onValueChange={(v) => setType(v as TransactionFilters["type"])}
                  >
                    <SelectTrigger className="w-[9rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All types</SelectItem>
                      <SelectItem value={TransactionType.EARNING}>Income</SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                <Select
                  value={businessId || "__all__"}
                  onValueChange={(v) => setBusinessId(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger className="w-[11rem]">
                    <SelectValue placeholder="Business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All businesses</SelectItem>
                    {(optionsQuery.data?.businesses ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[10.5rem]"
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[10.5rem]"
                  aria-label="To date"
                />
              </>
            }
          />

          <div className="md:hidden flex flex-col gap-2">
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No transactions match your filters.
              </p>
            ) : (
              rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 text-left text-sm"
                  onClick={() => {
                    setSelected(row);
                    setDetailOpen(true);
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(row.date), "d MMM yyyy")}
                      </span>
                      <Badge variant={row.type === TransactionType.EARNING ? "secondary" : "outline"}>
                        {TRANSACTION_TYPE_LABELS[row.type]}
                      </Badge>
                    </div>
                    <p className="mt-1 font-medium truncate">
                      {row.description ?? row.category ?? "—"}
                    </p>
                    {row.businessName ? (
                      <p className="text-xs text-muted-foreground truncate">{row.businessName}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums font-medium",
                      row.type === TransactionType.EARNING
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {row.type === TransactionType.EARNING ? "+" : "−"}
                    {formatINR(row.amount)}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={rows} getRowKey={(row) => row.id} />
          </div>

          <TransactionDetailDialog
            transaction={selected}
            open={detailOpen}
            onOpenChange={setDetailOpen}
          />
      </div>
    </QueryGate>
  );
}
