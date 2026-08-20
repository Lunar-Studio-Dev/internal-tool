"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryGate } from "@/components/common/query-gate";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { taskQueries, useCompleteTask } from "@/features/tasks/api";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import {
  type TaskBucket,
  TASK_BUCKET_LABELS,
  TASK_BUCKET_ORDER,
  bucketOfTask,
} from "@/features/tasks/constants";
import { useCurrentMember } from "@/features/team/hooks/use-current-member";
import { mutationErrorMessage } from "@/lib/api/errors";
import type { Priority, TaskStatus } from "@/generated/prisma/enums";

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  businessId: string | null;
  businessName: string | null;
  pipelineId: string | null;
  pipelineCode: string | null;
};

type TabKey = "MY" | "ALL" | "OVERDUE" | "TODAY" | "UPCOMING" | "COMPLETED";

const TAB_TO_BUCKETS: Partial<Record<TabKey, TaskBucket[]>> = {
  OVERDUE: ["OVERDUE"],
  TODAY: ["TODAY"],
  UPCOMING: ["TOMORROW", "UPCOMING"],
  COMPLETED: ["DONE"],
};

function TaskRowItem({ task }: { task: TaskRow }) {
  const completeTask = useCompleteTask();
  const done = task.status === "COMPLETED" || task.status === "CANCELLED";

  async function complete(checked: boolean) {
    if (!checked || done) return;
    try {
      await completeTask.mutateAsync(task.id);
      toast.success("Task completed");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  const context = [task.businessName, task.pipelineCode].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Checkbox checked={done} disabled={completeTask.isPending || done} onCheckedChange={(c) => complete(c === true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/todos/${task.id}`}
          className={`truncate text-sm hover:underline ${done ? "text-muted-foreground line-through" : "font-medium"}`}
        >
          {task.title}
        </Link>
        {context ? <span className="truncate text-xs text-muted-foreground">{context}</span> : null}
      </div>
      {task.dueAt ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {format(new Date(task.dueAt), "d MMM, HH:mm")}
        </span>
      ) : null}
      <StatusBadge kind={task.priority} />
    </div>
  );
}

function GroupedList({ tasks, buckets }: { tasks: TaskRow[]; buckets: TaskBucket[] }) {
  const groups = useMemo(() => {
    const map = new Map<TaskBucket, TaskRow[]>();
    for (const bucket of buckets) map.set(bucket, []);
    for (const task of tasks) {
      const bucket = bucketOfTask(task);
      if (map.has(bucket)) map.get(bucket)!.push(task);
    }
    return map;
  }, [tasks, buckets]);

  const visible = buckets.filter((b) => (groups.get(b)?.length ?? 0) > 0);
  if (visible.length === 0) {
    return <EmptyState title="Nothing here" description="No tasks match this view." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {visible.map((bucket) => {
        const rows = groups.get(bucket) ?? [];
        return (
          <div key={bucket} className="flex flex-col">
            <div className="flex items-center gap-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {TASK_BUCKET_LABELS[bucket]} · {rows.length}
            </div>
            <div className="divide-y rounded-lg border px-3">
              {rows.map((task) => (
                <TaskRowItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TaskDashboard() {
  const member = useCurrentMember();
  const [tab, setTab] = useState<TabKey>("MY");
  const tasksQuery = useQuery(taskQueries.list());
  const optionsQuery = useQuery(taskQueries.options());
  const tasks: TaskRow[] = useMemo(
    () =>
      (tasksQuery.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt,
        assigneeId: t.assigneeId,
        assigneeName: t.assigneeName,
        businessId: t.businessId,
        businessName: t.businessName,
        pipelineId: t.pipelineId,
        pipelineCode: t.pipelineCode,
      })),
    [tasksQuery.data],
  );

  const scoped = useMemo(() => {
    if (tab === "MY") return tasks.filter((t) => t.assigneeId === member.id);
    return tasks; // ALL + bucket tabs are team-wide
  }, [tasks, tab, member.id]);

  const buckets = TAB_TO_BUCKETS[tab] ?? TASK_BUCKET_ORDER;

  return (
    <QueryGate
      isPending={tasksQuery.isPending || optionsQuery.isPending}
      isError={tasksQuery.isError || optionsQuery.isError}
      error={tasksQuery.error ?? optionsQuery.error}
    >
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full sm:w-auto">
          <SectionTabsList>
            <SectionTabsTrigger value="MY">My Tasks</SectionTabsTrigger>
            <SectionTabsTrigger value="ALL">All Tasks</SectionTabsTrigger>
            <SectionTabsTrigger value="OVERDUE">Overdue</SectionTabsTrigger>
            <SectionTabsTrigger value="TODAY">Today</SectionTabsTrigger>
            <SectionTabsTrigger value="UPCOMING">Upcoming</SectionTabsTrigger>
            <SectionTabsTrigger value="COMPLETED">Completed</SectionTabsTrigger>
          </SectionTabsList>
        </SectionTabs>
        <TaskFormDialog
          mode="create"
          options={optionsQuery.data}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              New To-Do
            </Button>
          }
        />
      </div>

      <GroupedList tasks={scoped} buckets={buckets} />
    </div>
    </QueryGate>
  );
}
