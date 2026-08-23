"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIcon,
  CheckCircle2Icon,
  PauseCircleIcon,
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
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pipelineQueries } from "@/features/pipelines/api";
import { PipelineCreateDialog } from "@/features/pipelines/components/pipeline-create-dialog";
import {
  PHASE_LABELS,
  PIPELINE_STATUS_OPTIONS,
  WORKABLE_PHASES,
} from "@/features/pipelines/constants";
import {
  computePipelineListMetrics,
  filterPipelineList,
  pipelineListFilterToStatus,
  type PipelineListFilter,
} from "@/features/pipelines/pipeline-list-metrics";
import { useCan } from "@/features/team/hooks/use-current-member";
import { PhaseType, PipelineStatus } from "@/generated/prisma/enums";

export type PipelineRow = {
  id: string;
  code: string;
  businessId: string;
  businessName: string;
  name: string;
  currentPhase: PhaseType;
  status: PipelineStatus;
  assigneeNames: string[];
  createdAt: string;
};

type PipelineFilters = {
  phase: "ALL" | PhaseType;
  status: "ALL" | PipelineStatus;
  assignee: "ALL" | string;
  fromDate: string;
  toDate: string;
};

const FILTER_DEFAULTS: PipelineFilters = {
  phase: "ALL",
  status: "ALL",
  assignee: "ALL",
  fromDate: "",
  toDate: "",
};

export function PipelineTable() {
  const query = useQuery(pipelineQueries.list());
  const canWrite = useCan("pipeline:write");
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<"ALL" | PhaseType>("ALL");
  const [status, setStatus] = useState<"ALL" | PipelineStatus>("ALL");
  const [assignee, setAssignee] = useState<"ALL" | string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [listFilter, setListFilter] = useState<PipelineListFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft(
    { phase, status, assignee, fromDate, toDate },
    filterOpen,
  );

  const pipelines: PipelineRow[] = useMemo(
    () =>
      (query.data ?? []).map((p) => ({
        id: p.id,
        code: p.code,
        businessId: p.businessId,
        businessName: p.business.name,
        name: p.name,
        currentPhase: p.currentPhase,
        status: p.status,
        assigneeNames: p.assigneeNames ?? [],
        createdAt: p.createdAt,
      })),
    [query.data],
  );

  const assignees = useMemo(
    () =>
      [...new Set(pipelines.flatMap((p) => p.assigneeNames).filter(Boolean))].sort(),
    [pipelines],
  );

  const metrics = useMemo(() => computePipelineListMetrics(pipelines), [pipelines]);
  const activeFilterCount = countActiveFilters(
    { phase, status, assignee, fromDate, toDate },
    FILTER_DEFAULTS,
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statusFromList = pipelineListFilterToStatus(listFilter);
    const effectiveStatus = status !== "ALL" ? status : statusFromList;

    return filterPipelineList(pipelines, listFilter).filter((p) => {
      const assigneeText = p.assigneeNames.join(" ");
      if (q && !`${p.code} ${p.businessName} ${p.name} ${assigneeText}`.toLowerCase().includes(q)) {
        return false;
      }
      if (phase !== "ALL" && p.currentPhase !== phase) return false;
      if (effectiveStatus !== "ALL" && p.status !== effectiveStatus) return false;
      if (assignee !== "ALL" && !p.assigneeNames.includes(assignee)) return false;
      if (fromDate && p.createdAt.slice(0, 10) < fromDate) return false;
      if (toDate && p.createdAt.slice(0, 10) > toDate) return false;
      return true;
    });
  }, [pipelines, search, phase, status, assignee, fromDate, toDate, listFilter]);

  const columns: DataTableColumn<PipelineRow>[] = [
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
      id: "business",
      header: "Business",
      cell: (p) => (
        <Link href={`/businesses/${p.businessId}`} className="hover:underline">
          {p.businessName}
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
      id: "assignees",
      header: "Assigned to",
      cell: (p) =>
        p.assigneeNames.length ? (
          p.assigneeNames.join(", ")
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  function applyDraftFilters() {
    setPhase(draft.phase);
    setStatus(draft.status);
    setAssignee(draft.assignee);
    setFromDate(draft.fromDate);
    setToDate(draft.toDate);
    setListFilter("all");
  }

  const filterFields = (
    <>
      <FilterSheetSection label="Phase">
        <Select
          value={draft.phase}
          onValueChange={(v) => setDraft((prev) => ({ ...prev, phase: v as "ALL" | PhaseType }))}
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
          <Select
            value={draft.assignee}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, assignee: value }))}
          >
            <SelectTrigger className="w-full">
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
        </FilterSheetSection>
      ) : null}

      <FilterSheetSection label="Created date range">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={draft.fromDate}
            onChange={(e) => setDraft((prev) => ({ ...prev, fromDate: e.target.value }))}
            aria-label="Created from"
          />
          <Input
            type="date"
            value={draft.toDate}
            onChange={(e) => setDraft((prev) => ({ ...prev, toDate: e.target.value }))}
            aria-label="Created to"
          />
        </div>
      </FilterSheetSection>
    </>
  );

  const desktopFilters = (
    <>
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
      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v as "ALL" | PipelineStatus);
          setListFilter("all");
        }}
      >
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
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="w-40"
        aria-label="Created from"
      />
      <Input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="w-40"
        aria-label="Created to"
      />
    </>
  );

  const createAction = canWrite ? (
    <PipelineCreateDialog
      trigger={
        <Button>
          <PlusIcon className="size-4" />
          New Pipeline
        </Button>
      }
    />
  ) : null;

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<TablePageSkeleton columns={6} />}
    >
    <div className="flex flex-col gap-4">
      <div className={METRIC_GRID_CLASS}>
        <MetricCard
          icon={ActivityIcon}
          label="Active"
          value={metrics.active}
          hint={metrics.activeHint ?? undefined}
          onClick={() => {
            setListFilter("active");
            setStatus("ALL");
          }}
        />
        <MetricCard
          icon={WorkflowIcon}
          label="In progress"
          value={metrics.inProgress}
          hint={metrics.inProgressHint ?? undefined}
          onClick={() => {
            setListFilter("in_progress");
            setStatus("ALL");
          }}
        />
        <MetricCard
          icon={CheckCircle2Icon}
          label="Completed"
          value={metrics.completed}
          hint={metrics.completed > 0 ? "Won opportunities" : "None yet"}
          tone={metrics.completed > 0 ? "success" : "default"}
          onClick={() => {
            setListFilter("completed");
            setStatus("ALL");
          }}
        />
        <MetricCard
          icon={PauseCircleIcon}
          label="Deactivated"
          value={metrics.deactivated}
          hint={metrics.deactivated > 0 ? "Preserved history" : "None deactivated"}
          tone={metrics.deactivated > 0 ? "warning" : "default"}
          onClick={() => {
            setListFilter("deactivated");
            setStatus("ALL");
          }}
        />
      </div>

      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, business, pipeline name…"
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onApplyFilters={applyDraftFilters}
        onResetFilters={() => setDraft(FILTER_DEFAULTS)}
        filterSheetContent={filterFields}
        desktopFilters={desktopFilters}
        actions={createAction}
      />

      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(p) => p.id}
        empty="No pipelines match your filters."
      />
    </div>
    </QueryGate>
  );
}
