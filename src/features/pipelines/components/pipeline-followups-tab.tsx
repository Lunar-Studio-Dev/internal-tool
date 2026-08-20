"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
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
import { FollowUpFormDialog } from "@/features/followups/components/followup-form-dialog";
import { FollowUpList, type FollowUpRow } from "@/features/followups/components/followup-list";
import {
  computeFollowUpMetrics,
  filterFollowUps,
  type FollowUpFilter,
} from "@/features/followups/followup-metrics";
import type { PhaseType } from "@/generated/prisma/enums";

const FILTERS: { value: FollowUpFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

const FILTER_DEFAULTS = { filter: "all" as FollowUpFilter };

export function PipelineFollowUpsTab({
  pipelineId,
  businessId,
  currentPhase,
  followUps,
  canWrite,
  deactivated,
}: {
  pipelineId: string;
  businessId: string;
  currentPhase: PhaseType;
  followUps: FollowUpRow[];
  canWrite: boolean;
  deactivated: boolean;
}) {
  const [filter, setFilter] = useState<FollowUpFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ filter }, filterOpen);
  const metrics = useMemo(() => computeFollowUpMetrics(followUps), [followUps]);
  const filtered = useMemo(() => filterFollowUps(followUps, filter), [followUps, filter]);
  const activeFilterCount = countActiveFilters({ filter }, FILTER_DEFAULTS);

  return (
    <div className="flex flex-col gap-4">
      <div className={METRIC_GRID_CLASS}>
        <MetricCard icon={ClockIcon} label="Pending" value={metrics.pending} />
        <MetricCard
          icon={AlertCircleIcon}
          label="Overdue"
          value={metrics.overdue}
          tone="warning"
          hint={metrics.overdue > 0 ? "Needs attention" : undefined}
        />
        <MetricCard
          icon={CalendarClockIcon}
          label="Due today"
          value={metrics.dueToday}
          hint={
            metrics.nextDue
              ? `Next: ${format(new Date(metrics.nextDue.dueAt), "d MMM, HH:mm")}`
              : undefined
          }
        />
        <MetricCard
          icon={CheckCircle2Icon}
          label="Completed"
          value={metrics.completed}
          hint={metrics.rescheduled > 0 ? `${metrics.rescheduled} total reschedules` : undefined}
        />
      </div>

      <ListFilterBar
        showSearch={false}
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onApplyFilters={() => setFilter(draft.filter)}
        onResetFilters={() => setDraft(FILTER_DEFAULTS)}
        filterSheetContent={
          <FilterSheetSection label="Status">
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
            <FollowUpFormDialog
              businessId={businessId}
              pipelineId={pipelineId}
              phaseType={currentPhase}
              trigger={
                <Button size="sm">
                  <PlusIcon className="size-4" />
                  Schedule follow-up
                </Button>
              }
            />
          ) : null
        }
      />

      <FollowUpList
        items={filtered}
        canWrite={canWrite && !deactivated}
        businessId={businessId}
        pipelineId={pipelineId}
        emptyDescription={
          filter === "all"
            ? "No follow-ups for this pipeline yet."
            : `No ${filter} follow-ups.`
        }
      />
    </div>
  );
}
