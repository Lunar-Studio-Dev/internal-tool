import type { Metadata } from "next";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { TaskDashboard, type TaskRow } from "@/features/tasks/components/task-dashboard";
import { listTaskOptions, listTasks } from "@/features/tasks/server/tasks.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "To-Dos" };

export default async function TodosPage() {
  if (!(await currentMemberCan("task:read"))) {
    return (
      <>
        <PageHeader title="To-Dos" breadcrumbs={[{ label: "To-Dos" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view tasks."
        />
      </>
    );
  }

  const [tasks, options] = await Promise.all([listTasks(), listTaskOptions()]);
  const rows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    assigneeId: t.assigneeId,
    assigneeName: t.assigneeName,
    businessId: t.businessId,
    businessName: t.businessName,
    pipelineId: t.pipelineId,
    pipelineCode: t.pipelineCode,
  }));

  return (
    <>
      <PageHeader
        title="My To-Dos"
        description="Tasks across every client, pipeline, and project."
        breadcrumbs={[{ label: "To-Dos" }]}
      />
      <TaskDashboard tasks={rows} options={options} />
    </>
  );
}
