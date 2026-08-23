"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2Icon,
  PlusIcon,
  WorkflowIcon,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  countActiveFilters,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { QueryGate } from "@/components/common/query-gate";
import { TablePageSkeleton } from "@/components/common/skeletons";
import { EnumCombobox } from "@/components/common/combobox";
import type { ComboboxOption } from "@/components/common/combobox/types";
import { Button } from "@/components/ui/button";
import { businessQueries } from "@/features/businesses/api";
import {
  computeBusinessListMetrics,
  filterBusinessList,
  type BusinessListFilter,
} from "@/features/businesses/business-list-metrics";
import { BusinessCreateDialog } from "@/features/businesses/components/business-create-dialog";
import { useCan } from "@/features/team/hooks/use-current-member";

export type BusinessRow = {
  id: string;
  name: string;
  website: string;
  industry: string;
  industryId: string;
  sectorId: string;
  marketId: string;
  sourceCategoryId: string;
  locationIds: string[];
  tagIds: string[];
  primaryContact: string;
  pipelineCount: number;
  activePipelineCount: number;
};

type TableFilters = {
  industry: "ALL" | string;
  sector: "ALL" | string;
  market: "ALL" | string;
  sourceCategory: "ALL" | string;
  location: "ALL" | string;
};

const FILTER_DEFAULTS: TableFilters = {
  industry: "ALL",
  sector: "ALL",
  market: "ALL",
  sourceCategory: "ALL",
  location: "ALL",
};

function FilterCombobox({
  options,
  value,
  onChange,
  placeholder,
  allLabel,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allLabel: string;
}) {
  return (
    <EnumCombobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear
      clearLabel={allLabel}
      clearValue="ALL"
      searchable
    />
  );
}

export function BusinessTable() {
  const query = useQuery(businessQueries.list());
  const canWrite = useCan("business:write");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TableFilters>(FILTER_DEFAULTS);
  const [listFilter, setListFilter] = useState<BusinessListFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft(filters, filterOpen);

  const businesses: BusinessRow[] = useMemo(
    () =>
      (query.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        website: b.website ?? "",
        industry: b.profileIndustry?.name ?? b.industry ?? "",
        industryId: b.industryId ?? "",
        sectorId: b.sectorId ?? "",
        marketId: b.marketId ?? "",
        sourceCategoryId: b.sourceCategoryId ?? "",
        locationIds: b.businessLocations.map((bl) => bl.locationId),
        tagIds: b.businessTags.map((bt) => bt.tagId),
        primaryContact: b.contacts[0]?.name ?? "",
        pipelineCount: b.pipelines.length,
        activePipelineCount: b.pipelines.filter((p) => p.status === "ACTIVE").length,
      })),
    [query.data],
  );

  const filterOptions = useMemo(() => {
    const uniq = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
    const labelMap = new Map<string, string>();
    for (const b of query.data ?? []) {
      if (b.profileIndustry) labelMap.set(b.profileIndustry.id, b.profileIndustry.name);
      if (b.sector) labelMap.set(b.sector.id, b.sector.name);
      if (b.market) labelMap.set(b.market.id, b.market.name);
      if (b.sourceCategory) labelMap.set(b.sourceCategory.id, b.sourceCategory.name);
      for (const bl of b.businessLocations) labelMap.set(bl.location.id, bl.location.name);
    }
    const toOpts = (ids: string[]): ComboboxOption[] =>
      ids.map((id) => ({ value: id, label: labelMap.get(id) ?? id }));
    return {
      industries: toOpts(uniq(businesses.map((b) => b.industryId))),
      sectors: toOpts(uniq(businesses.map((b) => b.sectorId))),
      markets: toOpts(uniq(businesses.map((b) => b.marketId))),
      sourceCategories: toOpts(uniq(businesses.map((b) => b.sourceCategoryId))),
      locations: toOpts(uniq(businesses.flatMap((b) => b.locationIds))),
    };
  }, [businesses, query.data]);

  const metrics = useMemo(() => computeBusinessListMetrics(businesses), [businesses]);
  const activeFilterCount = countActiveFilters(filters, FILTER_DEFAULTS);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filterBusinessList(businesses, listFilter).filter((b) => {
      if (q && !`${b.name} ${b.website} ${b.primaryContact}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.industry !== "ALL" && b.industryId !== filters.industry) return false;
      if (filters.sector !== "ALL" && b.sectorId !== filters.sector) return false;
      if (filters.market !== "ALL" && b.marketId !== filters.market) return false;
      if (filters.sourceCategory !== "ALL" && b.sourceCategoryId !== filters.sourceCategory) {
        return false;
      }
      if (filters.location !== "ALL" && !b.locationIds.includes(filters.location)) return false;
      return true;
    });
  }, [businesses, search, filters, listFilter]);

  const columns: DataTableColumn<BusinessRow>[] = [
    {
      id: "name",
      header: "Business",
      cell: (b) => (
        <Link href={`/businesses/${b.id}`} className="font-medium hover:underline">
          {b.name}
        </Link>
      ),
    },
    {
      id: "website",
      header: "Website",
      cell: (b) =>
        b.website ? (
          <span className="text-muted-foreground">{b.website}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "industry",
      header: "Industry",
      cell: (b) =>
        b.industry ? b.industry : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "contact",
      header: "Contact",
      cell: (b) =>
        b.primaryContact ? b.primaryContact : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "pipelines",
      header: "Pipelines",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (b) => b.pipelineCount,
    },
    {
      id: "active",
      header: "Active",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (b) => b.activePipelineCount,
    },
    {
      id: "actions",
      header: "",
      headerClassName: "w-16",
      className: "w-16 text-right",
      cell: (b) => (
        <Link href={`/businesses/${b.id}`} className="text-sm text-muted-foreground hover:underline">
          View ›
        </Link>
      ),
    },
  ];

  const desktopFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        options={filterOptions.industries}
        value={filters.industry}
        onChange={(value) => setFilters((f) => ({ ...f, industry: value }))}
        placeholder="Industry"
        allLabel="All industries"
      />
      <FilterCombobox
        options={filterOptions.locations}
        value={filters.location}
        onChange={(value) => setFilters((f) => ({ ...f, location: value }))}
        placeholder="Location"
        allLabel="All locations"
      />
    </div>
  );

  const createAction = canWrite ? (
    <BusinessCreateDialog
      trigger={
        <Button>
          <PlusIcon className="size-4" />
          New Business
        </Button>
      }
    />
  ) : null;

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<TablePageSkeleton columns={7} />}
    >
    <div className="flex flex-col gap-4">
      <div className={METRIC_GRID_CLASS}>
        <MetricCard
          icon={Building2Icon}
          label="Total businesses"
          value={metrics.total}
          hint="In your directory"
          onClick={() => setListFilter("all")}
        />
        <MetricCard
          icon={WorkflowIcon}
          label="With pipelines"
          value={metrics.withPipelines}
          hint={metrics.withPipelinesHint ?? undefined}
          onClick={() => setListFilter("with_pipelines")}
        />
        <MetricCard
          icon={WorkflowIcon}
          label="Active pipelines"
          value={metrics.activePipelines}
          hint={metrics.activeHint ?? undefined}
          tone={metrics.activePipelines > 0 ? "default" : "warning"}
          onClick={() => setListFilter("with_active")}
        />
        <MetricCard
          icon={Building2Icon}
          label="Total pipelines"
          value={metrics.totalPipelines}
          hint={`Across ${metrics.total} business${metrics.total === 1 ? "" : "es"}`}
        />
      </div>

      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, website, or contact…"
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onApplyFilters={() => setFilters(draft)}
        onResetFilters={() => setDraft(FILTER_DEFAULTS)}
        filterSheetContent={
          <>
            <FilterSheetSection label="Industry">
              <FilterCombobox
                options={filterOptions.industries}
                value={draft.industry}
                onChange={(value) => setDraft({ ...draft, industry: value })}
                placeholder="Industry"
                allLabel="All industries"
              />
            </FilterSheetSection>
            <FilterSheetSection label="Sector">
              <FilterCombobox
                options={filterOptions.sectors}
                value={draft.sector}
                onChange={(value) => setDraft({ ...draft, sector: value })}
                placeholder="Sector"
                allLabel="All sectors"
              />
            </FilterSheetSection>
            <FilterSheetSection label="Market">
              <FilterCombobox
                options={filterOptions.markets}
                value={draft.market}
                onChange={(value) => setDraft({ ...draft, market: value })}
                placeholder="Market"
                allLabel="All markets"
              />
            </FilterSheetSection>
            <FilterSheetSection label="Source">
              <FilterCombobox
                options={filterOptions.sourceCategories}
                value={draft.sourceCategory}
                onChange={(value) => setDraft({ ...draft, sourceCategory: value })}
                placeholder="Source"
                allLabel="All sources"
              />
            </FilterSheetSection>
            <FilterSheetSection label="Location">
              <FilterCombobox
                options={filterOptions.locations}
                value={draft.location}
                onChange={(value) => setDraft({ ...draft, location: value })}
                placeholder="Location"
                allLabel="All locations"
              />
            </FilterSheetSection>
          </>
        }
        desktopFilters={desktopFilters}
        actions={createAction}
      />

      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(b) => b.id}
        empty="No businesses match your filters."
      />
    </div>
    </QueryGate>
  );
}
