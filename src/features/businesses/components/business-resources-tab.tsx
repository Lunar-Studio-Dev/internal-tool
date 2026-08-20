"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileTextIcon,
  FolderOpenIcon,
  ImageIcon,
  LinkIcon,
  PlusIcon,
} from "lucide-react";

import {
  countActiveFilters,
  FilterChipGroup,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { MetricCard, MetricCardSkeleton, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { QuerySection } from "@/components/common/query-gate";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessQueries } from "@/features/businesses/api";
import {
  BUSINESS_RESOURCE_FILTERS,
  computeBusinessResourceMetrics,
  filterBusinessResources,
} from "@/features/businesses/business-resource-metrics";
import type { ResourceFilter } from "@/features/resources/resource-metrics";
import { ResourceList, type ResourceListItem } from "@/features/resources/components/resource-list";
import { UploadDialog } from "@/features/resources/components/upload-dialog";

const FILTER_DEFAULTS = {
  filter: "all" as ResourceFilter,
  pipelineFilter: "ALL" as "ALL" | string,
};

export function BusinessResourcesTab({
  businessId,
  canWrite,
}: {
  businessId: string;
  canWrite: boolean;
}) {
  const resourcesQuery = useQuery(businessQueries.resources(businessId));
  const pipelinesQuery = useQuery(businessQueries.pipelines(businessId));
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const [pipelineFilter, setPipelineFilter] = useState<"ALL" | string>("ALL");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ filter, pipelineFilter }, filterOpen);

  const resources: ResourceListItem[] = useMemo(
    () =>
      (resourcesQuery.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        contentType: r.contentType,
        sizeBytes: r.sizeBytes,
        phaseType: r.phaseType,
        createdAt: r.createdAt,
        pipelineId: r.pipelineId,
        pipelineCode: r.pipelineCode,
      })),
    [resourcesQuery.data],
  );

  const metrics = useMemo(
    () =>
      computeBusinessResourceMetrics(
        resources.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          pipelineId: r.pipelineId,
        })),
      ),
    [resources],
  );

  const filtered = useMemo(() => {
    let rows = filterBusinessResources(resources, filter);
    if (pipelineFilter !== "ALL") {
      rows = rows.filter((r) => r.pipelineId === pipelineFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }
    return rows;
  }, [resources, filter, pipelineFilter, search]);

  const pipelineOptions = pipelinesQuery.data ?? [];
  const activeFilterCount = countActiveFilters({ filter, pipelineFilter }, FILTER_DEFAULTS);

  const pipelineSelect =
    pipelineOptions.length > 0 ? (
      <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Pipeline" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All pipelines</SelectItem>
          {pipelineOptions.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  return (
    <QuerySection
      isPending={resourcesQuery.isPending}
      isError={resourcesQuery.isError}
      error={resourcesQuery.error}
      skeleton={
        <div className={METRIC_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      }
      errorTitle="Could not load resources"
    >
      <div className="flex flex-col gap-4">
        <div className={METRIC_GRID_CLASS}>
          <MetricCard icon={FolderOpenIcon} label="Total" value={metrics.total} />
          <MetricCard
            icon={LinkIcon}
            label="Linked to pipeline"
            value={metrics.linked}
            hint={metrics.linkedHint}
          />
          <MetricCard
            icon={FileTextIcon}
            label="Documents"
            value={metrics.documents}
            hint="PDF, Word, text"
            onClick={metrics.documents > 0 ? () => setFilter("documents") : undefined}
          />
          <MetricCard
            icon={ImageIcon}
            label="Images"
            value={metrics.images}
            onClick={metrics.images > 0 ? () => setFilter("images") : undefined}
          />
        </div>

        <ListFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search resources…"
          activeFilterCount={activeFilterCount}
          filterOpen={filterOpen}
          onFilterOpenChange={setFilterOpen}
          onApplyFilters={() => {
            setFilter(draft.filter);
            setPipelineFilter(draft.pipelineFilter);
          }}
          onResetFilters={() => setDraft(FILTER_DEFAULTS)}
          filterSheetContent={
            <>
              <FilterSheetSection label="Type">
                <FilterChipGroup
                  value={draft.filter}
                  onChange={(value) => setDraft((prev) => ({ ...prev, filter: value }))}
                  options={BUSINESS_RESOURCE_FILTERS}
                />
              </FilterSheetSection>
              {pipelineOptions.length > 0 ? (
                <FilterSheetSection label="Pipeline">
                  <Select
                    value={draft.pipelineFilter}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, pipelineFilter: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All pipelines</SelectItem>
                      {pipelineOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterSheetSection>
              ) : null}
            </>
          }
          desktopFilters={
            <>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_RESOURCE_FILTERS.map((item) => (
                  <Button
                    key={item.value}
                    variant={filter === item.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              {pipelineSelect}
            </>
          }
          actions={
            canWrite ? (
              <UploadDialog
                prefill={{
                  businessId,
                  pipelineId: pipelineFilter !== "ALL" ? pipelineFilter : undefined,
                }}
                trigger={
                  <Button size="sm" className="shrink-0">
                    <PlusIcon className="size-4" />
                    Upload
                  </Button>
                }
              />
            ) : null
          }
        />

        <ResourceList
          items={filtered}
          canWrite={canWrite}
          showPipeline
          emptyDescription={
            filter === "all" && !search
              ? "No resources for this business yet."
              : "No resources match your filters."
          }
        />
      </div>
    </QuerySection>
  );
}
