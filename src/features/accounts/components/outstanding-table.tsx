"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  countActiveFilters,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { QueryGate } from "@/components/common/query-gate";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountQueries, type OutstandingItemDto } from "@/features/accounts/api";
import { RecordPaymentDialog } from "@/features/payments/components/record-payment-dialog";
import { formatINR } from "@/features/phases/constants";
import { useCan } from "@/features/team/hooks/use-current-member";
import { useQuery } from "@tanstack/react-query";
import { WalletIcon } from "lucide-react";

type OutstandingFilters = {
  businessId: string;
};

const FILTER_DEFAULTS: OutstandingFilters = {
  businessId: "",
};

export function OutstandingTable() {
  const query = useQuery(accountQueries.outstanding());
  const optionsQuery = useQuery(accountQueries.options());
  const canRecordPayment = useCan("payment:write");

  const [search, setSearch] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ businessId }, filterOpen);

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (businessId && row.businessId !== businessId) return false;
      if (!q) return true;
      return (
        row.businessName.toLowerCase().includes(q) ||
        row.pipelineCode.toLowerCase().includes(q) ||
        row.pipelineName.toLowerCase().includes(q)
      );
    });
  }, [query.data, businessId, search]);

  const activeFilterCount = countActiveFilters({ businessId }, FILTER_DEFAULTS);

  const columns: DataTableColumn<OutstandingItemDto>[] = [
    {
      id: "business",
      header: "Business",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.businessName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {row.pipelineCode} · {row.pipelineName}
          </p>
        </div>
      ),
    },
    {
      id: "quotation",
      header: "Quotation",
      cell: (row) => `V${row.quotationVersion}`,
    },
    {
      id: "required",
      header: "Required",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (row) => formatINR(row.requiredPaise),
    },
    {
      id: "received",
      header: "Received",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (row) => formatINR(row.receivedPaise),
    },
    {
      id: "remaining",
      header: "Remaining",
      headerClassName: "text-right",
      className: "text-right tabular-nums font-medium",
      cell: (row) => formatINR(row.remainingPaise),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) =>
        row.receivedPaise > 0 ? (
          <Badge variant="outline">Partial</Badge>
        ) : (
          <StatusBadge kind="PENDING" />
        ),
    },
    {
      id: "action",
      header: "Action",
      cell: (row) =>
        canRecordPayment ? (
          <RecordPaymentDialog
            pipelineId={row.pipelineId}
            businessName={row.businessName}
            pipelineCode={row.pipelineCode}
            quotationLabel={`V${row.quotationVersion} · ${formatINR(row.requiredPaise)}`}
            remainingPaise={row.remainingPaise}
            trigger={
              <Button size="sm" variant="outline">
                Record payment
              </Button>
            }
          />
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/pipelines/${row.pipelineId}?tab=payments`}>View pipeline</Link>
          </Button>
        ),
    },
  ];

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<div className="h-48 animate-pulse rounded-lg bg-muted" />}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Accepted quotations with contract balance still due. Payments recorded on a pipeline
          appear here automatically.
        </p>

        <ListFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search outstanding…"
          activeFilterCount={activeFilterCount}
          filterOpen={filterOpen}
          onFilterOpenChange={setFilterOpen}
          onApplyFilters={() => setBusinessId(draft.businessId ?? "")}
          onResetFilters={() => setBusinessId("")}
          filterSheetContent={
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
          }
          desktopFilters={
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
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="Nothing outstanding"
            description="All accepted quotations are fully paid, or no accepted deals yet."
          />
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-2">
              {filtered.map((row) => (
                <div key={row.pipelineId} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{row.businessName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.pipelineCode} · Quotation V{row.quotationVersion}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Required</p>
                      <p className="font-medium tabular-nums">{formatINR(row.requiredPaise)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Received</p>
                      <p className="font-medium tabular-nums">{formatINR(row.receivedPaise)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium tabular-nums">{formatINR(row.remainingPaise)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {canRecordPayment ? (
                      <RecordPaymentDialog
                        pipelineId={row.pipelineId}
                        businessName={row.businessName}
                        pipelineCode={row.pipelineCode}
                        quotationLabel={`V${row.quotationVersion} · ${formatINR(row.requiredPaise)}`}
                        remainingPaise={row.remainingPaise}
                        trigger={
                          <Button size="sm" className="w-full">
                            Record payment
                          </Button>
                        }
                      />
                    ) : (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href={`/pipelines/${row.pipelineId}?tab=payments`}>
                          View pipeline
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <DataTable columns={columns} data={filtered} getRowKey={(row) => row.pipelineId} />
            </div>
          </>
        )}
      </div>
    </QueryGate>
  );
}
