"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import {
  type TaskBucket,
  TASK_BUCKET_LABELS,
  TASK_BUCKET_ORDER,
  bucketOfTask,
} from "@/features/tasks/constants";
import { completeTaskAction } from "@/features/tasks/server/tasks.actions";
import type { TaskOptions } from "@/features/tasks/server/tasks.queries";
import { useCurrentMember } from "@/features/team/hooks/use-current-member";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const done = task.status === "COMPLETED" || task.status === "CANCELLED";

  function complete(checked: boolean) {
    if (!checked || done) return;
    startTransition(async () => {
      const result = await completeTaskAction(task.id);
      if (result.ok) toast.success("Task completed");
      else toast.error(result.error);
      router.refresh();
    });
  }

  const context = [task.businessName, task.pipelineCode].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Checkbox checked={done} disabled={isPending || done} onCheckedChange={(c) => complete(c === true)} />
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

export function TaskDashboard({ tasks, options }: { tasks: TaskRow[]; options: TaskOptions }) {
  const member = useCurrentMember();
  const [tab, setTab] = useState<TabKey>("MY");

  const scoped = useMemo(() => {
    if (tab === "MY") return tasks.filter((t) => t.assigneeId === member.id);
    return tasks; // ALL + bucket tabs are team-wide
  }, [tasks, tab, member.id]);

  const buckets = TAB_TO_BUCKETS[tab] ?? TASK_BUCKET_ORDER;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="MY">My Tasks</TabsTrigger>
            <TabsTrigger value="ALL">All Tasks</TabsTrigger>
            <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
            <TabsTrigger value="TODAY">Today</TabsTrigger>
            <TabsTrigger value="UPCOMING">Upcoming</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <TaskFormDialog
          mode="create"
          options={options}
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
  );
}
