"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ListTodoIcon,
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
import { TaskList, type TaskRow } from "@/features/tasks/components/task-list";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import type { TaskFormInitial } from "@/features/tasks/components/task-form";
import { computeTaskMetrics, filterTasks, type TaskFilter } from "@/features/tasks/task-metrics";
import { Priority, type TaskStatus } from "@/generated/prisma/enums";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due today" },
  { value: "completed", label: "Completed" },
];

const FILTER_DEFAULTS = { filter: "all" as TaskFilter, pipelineFilter: "ALL" as "ALL" | string };

export function BusinessTasksTab({
  businessId,
  canWrite,
}: {
  businessId: string;
  canWrite: boolean;
}) {
  const tasksQuery = useQuery(businessQueries.tasks(businessId));
  const pipelinesQuery = useQuery(businessQueries.pipelines(businessId));
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [pipelineFilter, setPipelineFilter] = useState<"ALL" | string>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ filter, pipelineFilter }, filterOpen);

  const taskRows: TaskRow[] = useMemo(
    () =>
      (tasksQuery.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt,
        assigneeName: t.assigneeName,
        phaseType: t.phaseType,
        pipelineId: t.pipelineId,
        pipelineCode: t.pipelineCode,
      })),
    [tasksQuery.data],
  );

  const scopedTasks = useMemo(() => {
    if (pipelineFilter === "ALL") return taskRows;
    return taskRows.filter((t) => t.pipelineId === pipelineFilter);
  }, [taskRows, pipelineFilter]);

  const metrics = useMemo(() => computeTaskMetrics(scopedTasks), [scopedTasks]);
  const filtered = useMemo(() => filterTasks(scopedTasks, filter), [scopedTasks, filter]);
  const activeFilterCount = countActiveFilters({ filter, pipelineFilter }, FILTER_DEFAULTS);

  const taskPrefill: TaskFormInitial = {
    title: "",
    assigneeId: "",
    dueAt: "",
    priority: Priority.MEDIUM,
    status: "TODO" as TaskStatus,
    businessId,
    pipelineId: pipelineFilter !== "ALL" ? pipelineFilter : "",
    phaseType: "",
    notes: "",
  };

  const pipelineOptions = pipelinesQuery.data ?? [];

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
      isPending={tasksQuery.isPending}
      isError={tasksQuery.isError}
      error={tasksQuery.error}
      skeleton={
        <div className={METRIC_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      }
      errorTitle="Could not load tasks"
    >
      <div className="flex flex-col gap-4">
        <div className={METRIC_GRID_CLASS}>
          <MetricCard icon={ListTodoIcon} label="Open" value={metrics.open} />
          <MetricCard
            icon={AlertCircleIcon}
            label="Overdue"
            value={metrics.overdue}
            tone={metrics.overdue > 0 ? "warning" : "default"}
            hint={metrics.overdue > 0 ? "Needs attention" : undefined}
            onClick={metrics.overdue > 0 ? () => setFilter("overdue") : undefined}
          />
          <MetricCard
            icon={CalendarClockIcon}
            label="Due today"
            value={metrics.dueToday}
            hint={
              metrics.nextDue?.dueAt
                ? `Next: ${format(new Date(metrics.nextDue.dueAt), "d MMM, HH:mm")}`
                : undefined
            }
            onClick={metrics.dueToday > 0 ? () => setFilter("due_today") : undefined}
          />
          <MetricCard
            icon={CheckCircle2Icon}
            label="Completed"
            value={metrics.completed}
            hint={metrics.inProgress > 0 ? `${metrics.inProgress} in progress` : undefined}
          />
        </div>

        <ListFilterBar
          showSearch={false}
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
              <FilterSheetSection label="Status">
                <FilterChipGroup
                  value={draft.filter}
                  onChange={(value) => setDraft((prev) => ({ ...prev, filter: value }))}
                  options={FILTERS}
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
              {pipelineSelect}
            </>
          }
          actions={
            canWrite ? (
              <TaskFormDialog
                mode="create"
                initial={taskPrefill}
                trigger={
                  <Button size="sm">
                    <PlusIcon className="size-4" />
                    Add task
                  </Button>
                }
              />
            ) : null
          }
        />

        <TaskList
          items={filtered}
          showPipeline
          emptyDescription={
            filter === "all"
              ? "No tasks for this business yet."
              : `No ${filter.replace("_", " ")} tasks.`
          }
        />
      </div>
    </QuerySection>
  );
}
