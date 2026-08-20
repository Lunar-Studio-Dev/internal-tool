"use client";

import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompleteTask } from "@/features/tasks/api";
import { isTaskOverdue } from "@/features/tasks/task-metrics";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import type { PhaseType, Priority, TaskStatus } from "@/generated/prisma/enums";

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  assigneeName: string | null;
  phaseType?: PhaseType | null;
  pipelineId?: string | null;
  pipelineCode?: string | null;
};

function TaskRowItem({ item, showPipeline }: { item: TaskRow; showPipeline?: boolean }) {
  const completeTask = useCompleteTask();
  const done = item.status === "COMPLETED" || item.status === "CANCELLED";
  const overdue = isTaskOverdue(item);

  async function complete(checked: boolean) {
    if (!checked || done) return;
    try {
      await completeTask.mutateAsync(item.id);
      toast.success("Task completed");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div
      className={`flex items-start gap-3 py-3 ${overdue ? "border-l-2 border-amber-500 pl-3" : ""}`}
    >
      <Checkbox
        checked={done}
        disabled={completeTask.isPending || done}
        onCheckedChange={(checked) => void complete(checked === true)}
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/todos/${item.id}`}
            className={`text-sm hover:underline ${done ? "text-muted-foreground line-through" : "font-medium"}`}
          >
            {item.title}
          </Link>
          {item.phaseType ? (
            <Badge variant="secondary" className="font-normal">
              {PHASE_LABELS[item.phaseType]}
            </Badge>
          ) : null}
          {showPipeline && item.pipelineCode && item.pipelineId ? (
            <Badge variant="outline" className="font-normal">
              <Link href={`/pipelines/${item.pipelineId}`} className="hover:underline">
                {item.pipelineCode}
              </Link>
            </Badge>
          ) : null}
          {overdue ? (
            <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
              Overdue
            </Badge>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {item.dueAt ? `Due ${format(new Date(item.dueAt), "d MMM yyyy, HH:mm")}` : "No due date"}
          {item.assigneeName ? ` · ${item.assigneeName}` : ""}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge kind={item.priority} />
        {!done ? <StatusBadge kind={item.status} /> : null}
      </div>
    </div>
  );
}

export function TaskList({
  items,
  showPipeline = false,
  emptyDescription = "Tasks for this pipeline will appear here.",
}: {
  items: TaskRow[];
  showPipeline?: boolean;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title="No tasks" description={emptyDescription} />;
  }

  return (
    <div className="divide-y rounded-lg border px-3">
      {items.map((item) => (
        <TaskRowItem key={item.id} item={item} showPipeline={showPipeline} />
      ))}
    </div>
  );
}
