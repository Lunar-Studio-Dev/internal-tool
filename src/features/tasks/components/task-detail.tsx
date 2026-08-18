import Link from "next/link";
import { format } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDetailActions } from "@/features/tasks/components/task-detail-actions";
import type { TaskFormInitial } from "@/features/tasks/components/task-form";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/features/tasks/constants";
import type { TaskDetailItem, TaskOptions } from "@/features/tasks/server/tasks.queries";
import { PHASE_LABELS } from "@/features/pipelines/constants";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function TaskDetail({ task, options }: { task: TaskDetailItem; options: TaskOptions }) {
  const initial: TaskFormInitial = {
    id: task.id,
    title: task.title,
    assigneeId: task.assigneeId ?? "",
    dueAt: task.dueAt ? format(task.dueAt, "yyyy-MM-dd'T'HH:mm") : "",
    priority: task.priority,
    status: task.status,
    businessId: task.businessId ?? "",
    pipelineId: task.pipelineId ?? "",
    phaseType: task.phaseType ?? "",
    notes: task.notes ?? "",
  };

  return (
    <>
      <PageHeader
        title={task.title}
        breadcrumbs={[{ label: "To-Dos", href: "/todos" }, { label: task.title }]}
        action={<StatusBadge kind={task.status} />}
      />
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Details</CardTitle>
            <StatusBadge kind={task.priority} />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info label="Status" value={TASK_STATUS_LABELS[task.status]} />
            <Info label="Assigned to" value={task.assigneeName ?? "Unassigned"} />
            <Info
              label="Due"
              value={task.dueAt ? format(task.dueAt, "d MMM yyyy, HH:mm") : "—"}
            />
            <Info label="Priority" value={PRIORITY_LABELS[task.priority]} />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Business</span>
              {task.businessId ? (
                <Link href={`/businesses/${task.businessId}`} className="hover:underline">
                  {task.businessName ?? "—"}
                </Link>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Pipeline</span>
              {task.pipelineId ? (
                <Link href={`/pipelines/${task.pipelineId}`} className="hover:underline">
                  {task.pipelineCode ?? "—"}
                </Link>
              ) : (
                <span>—</span>
              )}
            </div>
            <Info label="Phase" value={task.phaseType ? PHASE_LABELS[task.phaseType] : "—"} />
            <div className="col-span-2 sm:col-span-3">
              <Info label="Notes" value={task.notes ?? "—"} />
            </div>
          </CardContent>
        </Card>

        <TaskDetailActions
          taskId={task.id}
          status={task.status}
          assigneeId={task.assigneeId}
          initial={initial}
          options={options}
        />
      </div>
    </>
  );
}
