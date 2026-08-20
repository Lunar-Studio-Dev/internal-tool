"use client";

import { useMemo, useState } from "react";
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
import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { Button } from "@/components/ui/button";
import { TaskList, type TaskRow } from "@/features/tasks/components/task-list";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import type { TaskFormInitial } from "@/features/tasks/components/task-form";
import { computeTaskMetrics, filterTasks, type TaskFilter } from "@/features/tasks/task-metrics";
import type { PhaseType } from "@/generated/prisma/enums";
import { Priority, type TaskStatus } from "@/generated/prisma/enums";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due today" },
  { value: "completed", label: "Completed" },
];

const FILTER_DEFAULTS = { filter: "all" as TaskFilter };

export function PipelineTasksTab({
  pipelineId,
  businessId,
  currentPhase,
  tasks,
  canWrite,
  deactivated,
}: {
  pipelineId: string;
  businessId: string;
  currentPhase: PhaseType;
  tasks: TaskRow[];
  canWrite: boolean;
  deactivated: boolean;
}) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ filter }, filterOpen);
  const metrics = useMemo(() => computeTaskMetrics(tasks), [tasks]);
  const filtered = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);
  const activeFilterCount = countActiveFilters({ filter }, FILTER_DEFAULTS);

  const taskPrefill: TaskFormInitial = {
    title: "",
    assigneeId: "",
    dueAt: "",
    priority: Priority.MEDIUM,
    status: "TODO" as TaskStatus,
    businessId,
    pipelineId,
    phaseType: currentPhase,
    notes: "",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={METRIC_GRID_CLASS}>
        <MetricCard icon={ListTodoIcon} label="Open" value={metrics.open} />
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
            metrics.nextDue?.dueAt
              ? `Next: ${format(new Date(metrics.nextDue.dueAt), "d MMM, HH:mm")}`
              : undefined
          }
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
        emptyDescription={
          filter === "all" ? "No tasks for this pipeline yet." : `No ${filter.replace("_", " ")} tasks.`
        }
      />
    </div>
  );
}
