"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ActivityIcon,
  CheckCircle2Icon,
  IndianRupeeIcon,
  PauseCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  WorkflowIcon,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  countActiveFilters,
  FilterChipGroup,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { MetricCard, MetricCardSkeleton, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { QuerySection } from "@/components/common/query-gate";
import { StatusBadge } from "@/components/common/status-badge";
import { StringListCombobox } from "@/components/common/combobox";
import { Badge } from "@/components/ui/badge";
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
  computeBusinessPipelineMetrics,
  filterBusinessPipelines,
  type BusinessPipelineFilter,
  type BusinessPipelineRow,
} from "@/features/businesses/business-pipeline-metrics";
import { CLIENT_DECISION_LABELS } from "@/features/phases/quotation-metrics";
import { formatINR } from "@/features/phases/constants";
import { CompletePipelineDialog } from "@/features/pipelines/components/complete-pipeline-dialog";
import { PipelineCreateDialog } from "@/features/pipelines/components/pipeline-create-dialog";
import { ReactivationDialog } from "@/features/pipelines/components/reactivation-dialog";
import {
  canCompletePipeline,
  PHASE_LABELS,
  PIPELINE_STATUS_OPTIONS,
  WORKABLE_PHASES,
} from "@/features/pipelines/constants";
import type { PhaseType, PipelineStatus } from "@/generated/prisma/enums";

const KPI_FILTERS: { value: BusinessPipelineFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
  { value: "in_progress", label: "In progress" },
  { value: "handed_off", label: "Handed off" },
];

const CHIP_FILTER_OPTIONS: { value: BusinessPipelineFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...KPI_FILTERS,
];

const FILTER_DEFAULTS = {
  chipFilter: "all" as BusinessPipelineFilter,
  phase: "ALL" as "ALL" | PhaseType,
  status: "ALL" as "ALL" | PipelineStatus,
  assignee: "ALL" as "ALL" | string,
};

export function BusinessPipelinesTab({
  businessId,
  canWrite,
}: {
  businessId: string;
  canWrite: boolean;
}) {
  const pipelinesQuery = useQuery(businessQueries.pipelines(businessId));
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<"ALL" | PhaseType>("ALL");
  const [status, setStatus] = useState<"ALL" | PipelineStatus>("ALL");
  const [assignee, setAssignee] = useState<"ALL" | string>("ALL");
  const [chipFilter, setChipFilter] = useState<BusinessPipelineFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft(
    { chipFilter, phase, status, assignee },
    filterOpen,
  );

  const activeFilterCount = countActiveFilters(
    { chipFilter, phase, status, assignee },
    FILTER_DEFAULTS,
  );

  const pipelines: BusinessPipelineRow[] = useMemo(
    () =>
      (pipelinesQuery.data ?? []).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        currentPhase: p.currentPhase,
        status: p.status,
        assigneeNames: p.assigneeNames ?? [],
        createdAt: p.createdAt,
        decision: p.decision,
        handedOff: p.handedOff,
        quotationSubtotal: p.quotationSubtotal,
      })),
    [pipelinesQuery.data],
  );

  const metrics = useMemo(() => computeBusinessPipelineMetrics(pipelines), [pipelines]);

  const assignees = useMemo(
    () =>
      [...new Set(pipelines.flatMap((p) => p.assigneeNames).filter(Boolean))].sort() as string[],
    [pipelines],
  );

  const filtered = useMemo(() => {
    let rows = filterBusinessPipelines(pipelines, chipFilter);
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      const assigneeText = p.assigneeNames.join(" ");
      if (q && !`${p.code} ${p.name} ${assigneeText}`.toLowerCase().includes(q)) {
        return false;
      }
      if (phase !== "ALL" && p.currentPhase !== phase) return false;
      if (status !== "ALL" && p.status !== status) return false;
      if (assignee !== "ALL" && !p.assigneeNames.includes(assignee)) return false;
      return true;
    });
  }, [pipelines, chipFilter, search, phase, status, assignee]);

  const columns: DataTableColumn<BusinessPipelineRow>[] = useMemo(
    () => [
      {
        id: "code",
        header: "ID",
        cell: (p) => (
          <Link href={`/pipelines/${p.id}`} className="font-medium hover:underline">
            {p.code}
          </Link>
        ),
      },
      {
        id: "name",
        header: "Pipeline name",
        cell: (p) => (
          <Link href={`/pipelines/${p.id}`} className="hover:underline">
            {p.name}
          </Link>
        ),
      },
      { id: "phase", header: "Phase", cell: (p) => PHASE_LABELS[p.currentPhase] },
      { id: "status", header: "Status", cell: (p) => <StatusBadge kind={p.status} /> },
      {
        id: "decision",
        header: "Decision",
        cell: (p) =>
          p.decision ? (
            <Badge variant={p.decision === "ACCEPTED" ? "default" : "secondary"} className="font-normal">
              {CLIENT_DECISION_LABELS[p.decision]}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "value",
        header: "Value",
        cell: (p) =>
          p.quotationSubtotal != null ? (
            formatINR(p.quotationSubtotal)
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "assignees",
        header: "Assigned to",
        cell: (p) =>
          p.assigneeNames.length ? (
            p.assigneeNames.join(", ")
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "created",
        header: "Created",
        cell: (p) => (
          <span className="text-muted-foreground">
            {format(new Date(p.createdAt), "d MMM yyyy")}
          </span>
        ),
      },
      ...(canWrite
        ? [
            {
              id: "actions",
              header: "",
              headerClassName: "w-36",
              className: "w-36 text-right",
              cell: (p: BusinessPipelineRow) =>
                p.status === "DEACTIVATED" ? (
                  <ReactivationDialog
                    pipelineId={p.id}
                    pipelineCode={p.code}
                    resumePhaseLabel={PHASE_LABELS[p.currentPhase]}
                    trigger={
                      <Button variant="outline" size="sm">
                        <RotateCcwIcon className="size-4" />
                        Reactivate
                      </Button>
                    }
                  />
                ) : canCompletePipeline({
                    status: p.status,
                    currentPhase: p.currentPhase,
                    handedOff: p.handedOff,
                  }) ? (
                  <CompletePipelineDialog
                    pipelineId={p.id}
                    pipelineLabel={`${p.code} · ${p.name}`}
                    trigger={
                      <Button variant="outline" size="sm">
                        <CheckCircle2Icon className="size-4" />
                        Complete
                      </Button>
                    }
                  />
                ) : null,
            } satisfies DataTableColumn<BusinessPipelineRow>,
          ]
        : []),
    ],
    [canWrite],
  );

  return (
    <QuerySection
      isPending={pipelinesQuery.isPending}
      isError={pipelinesQuery.isError}
      error={pipelinesQuery.error}
      skeleton={
        <div className={METRIC_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      }
      errorTitle="Could not load pipelines"
    >
      {pipelines.length === 0 ? (
        <div className="flex flex-col gap-4">
          {canWrite ? (
            <div className="flex justify-end">
              <PipelineCreateDialog
                businessId={businessId}
                trigger={
                  <Button size="sm">
                    <PlusIcon className="size-4" />
                    New pipeline
                  </Button>
                }
              />
            </div>
          ) : null}
          <EmptyState
            icon={WorkflowIcon}
            title="No pipelines yet"
            description="Create the first pipeline for this business."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className={METRIC_GRID_CLASS}>
            <MetricCard
              icon={ActivityIcon}
              label="Active"
              value={metrics.active}
              hint={metrics.activeHint}
              onClick={() => setChipFilter("active")}
            />
            <MetricCard
              icon={PauseCircleIcon}
              label="Deactivated"
              value={metrics.deactivated}
              hint={metrics.deactivatedHint}
              tone={metrics.deactivated > 0 ? "warning" : "default"}
              onClick={() => setChipFilter("deactivated")}
            />
            <MetricCard
              icon={WorkflowIcon}
              label="In progress"
              value={metrics.inProgress}
              hint={metrics.inProgressHint ?? undefined}
              onClick={() => setChipFilter("in_progress")}
            />
            <MetricCard
              icon={IndianRupeeIcon}
              label="Pipeline value"
              value={formatINR(metrics.totalValuePaise)}
              hint={metrics.valueHint ?? undefined}
            />
          </div>

          <ListFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search code, pipeline name, assignee…"
            activeFilterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
            onApplyFilters={() => {
              setChipFilter(draft.chipFilter);
              setPhase(draft.phase);
              setStatus(draft.status);
              setAssignee(draft.assignee);
            }}
            onResetFilters={() => setDraft(FILTER_DEFAULTS)}
            filterSheetContent={
              <>
                <FilterSheetSection label="Quick filter">
                  <FilterChipGroup
                    value={draft.chipFilter}
                    onChange={(value) => setDraft((prev) => ({ ...prev, chipFilter: value }))}
                    options={CHIP_FILTER_OPTIONS}
                  />
                </FilterSheetSection>
                <FilterSheetSection label="Phase">
                  <Select
                    value={draft.phase}
                    onValueChange={(v) =>
                      setDraft((prev) => ({ ...prev, phase: v as "ALL" | PhaseType }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All phases</SelectItem>
                      {WORKABLE_PHASES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PHASE_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterSheetSection>
                <FilterSheetSection label="Status">
                  <Select
                    value={draft.status}
                    onValueChange={(v) =>
                      setDraft((prev) => ({ ...prev, status: v as "ALL" | PipelineStatus }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      {PIPELINE_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterSheetSection>
                {assignees.length > 0 ? (
                  <FilterSheetSection label="Assigned to">
                    <StringListCombobox
                      options={assignees}
                      value={draft.assignee}
                      onChange={(value) => setDraft((prev) => ({ ...prev, assignee: value }))}
                      placeholder="Assigned to"
                      allowAll
                      allLabel="All assignees"
                      allValue="ALL"
                    />
                  </FilterSheetSection>
                ) : null}
              </>
            }
            desktopFilters={
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={chipFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChipFilter("all")}
                  >
                    All
                  </Button>
                  {KPI_FILTERS.map((item) => (
                    <Button
                      key={item.value}
                      variant={chipFilter === item.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChipFilter(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <Select value={phase} onValueChange={(v) => setPhase(v as "ALL" | PhaseType)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All phases</SelectItem>
                    {WORKABLE_PHASES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PHASE_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | PipelineStatus)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {PIPELINE_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignees.length > 0 ? (
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Assigned to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All assignees</SelectItem>
                      {assignees.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </>
            }
            actions={
              canWrite ? (
                <PipelineCreateDialog
                  businessId={businessId}
                  trigger={
                    <Button size="sm">
                      <PlusIcon className="size-4" />
                      New pipeline
                    </Button>
                  }
                />
              ) : null
            }
          />

          <DataTable
            columns={columns}
            data={filtered}
            getRowKey={(p) => p.id}
            empty="No pipelines match your filters."
          />
        </div>
      )}
    </QuerySection>
  );
}
