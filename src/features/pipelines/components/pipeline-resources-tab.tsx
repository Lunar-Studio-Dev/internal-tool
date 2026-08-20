"use client";

import { useMemo, useState } from "react";
import {
  FileTextIcon,
  FolderOpenIcon,
  ImageIcon,
  LayersIcon,
  PlusIcon,
} from "lucide-react";

import {
  countActiveFilters,
  FilterChipGroup,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { Button } from "@/components/ui/button";
import { UploadDialog } from "@/features/resources/components/upload-dialog";
import { ResourceList, type ResourceListItem } from "@/features/resources/components/resource-list";
import {
  computeResourceMetrics,
  filterResources,
  type ResourceFilter,
} from "@/features/resources/resource-metrics";
import type { PhaseType } from "@/generated/prisma/enums";

const FILTERS: { value: ResourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "this_phase", label: "This phase" },
  { value: "documents", label: "Documents" },
  { value: "images", label: "Images" },
  { value: "quotation", label: "Quotation" },
  { value: "requirement", label: "Requirement" },
  { value: "research", label: "Research" },
  { value: "meeting_notes", label: "Meeting notes" },
  { value: "other", label: "Other" },
];

const FILTER_DEFAULTS = { filter: "all" as ResourceFilter };

export function PipelineResourcesTab({
  pipelineId,
  businessId,
  currentPhase,
  resources,
  canWrite,
  deactivated,
}: {
  pipelineId: string;
  businessId: string;
  currentPhase: PhaseType;
  resources: ResourceListItem[];
  canWrite: boolean;
  deactivated: boolean;
}) {
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ filter }, filterOpen);
  const metrics = useMemo(
    () => computeResourceMetrics(resources, currentPhase),
    [resources, currentPhase],
  );
  const filtered = useMemo(
    () => filterResources(resources, filter, currentPhase),
    [resources, filter, currentPhase],
  );
  const activeFilterCount = countActiveFilters({ filter }, FILTER_DEFAULTS);

  return (
    <div className="flex flex-col gap-4">
      <div className={METRIC_GRID_CLASS}>
        <MetricCard icon={FolderOpenIcon} label="Total" value={metrics.total} />
        <MetricCard
          icon={LayersIcon}
          label="This phase"
          value={metrics.thisPhase}
          hint={metrics.thisPhase > 0 ? "Tied to current phase" : undefined}
        />
        <MetricCard
          icon={FileTextIcon}
          label="Documents"
          value={metrics.documents}
          hint="PDF, Word, text"
        />
        <MetricCard icon={ImageIcon} label="Images" value={metrics.images} />
      </div>

      <ListFilterBar
        showSearch={false}
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onApplyFilters={() => setFilter(draft.filter)}
        onResetFilters={() => setDraft(FILTER_DEFAULTS)}
        filterSheetContent={
          <FilterSheetSection label="Type">
            <FilterChipGroup
              value={draft.filter}
              onChange={(value) => setDraft({ filter: value })}
              options={FILTERS}
            />
          </FilterSheetSection>
        }
        desktopFilters={
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
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
        }
        actions={
          canWrite && !deactivated ? (
            <UploadDialog
              prefill={{ businessId, pipelineId, phaseType: currentPhase }}
              trigger={
                <Button size="sm" className="shrink-0">
                  <PlusIcon className="size-4" />
                  Add resource
                </Button>
              }
            />
          ) : null
        }
      />

      <ResourceList
        items={filtered}
        canWrite={canWrite && !deactivated}
        emptyDescription={
          filter === "all"
            ? "No resources for this pipeline yet."
            : `No ${filter.replace("_", " ")} resources.`
        }
      />
    </div>
  );
}
