import { notFound } from "next/navigation";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { TaskDetail } from "@/features/tasks/components/task-detail";
import { getTaskById, listTaskOptions } from "@/features/tasks/server/tasks.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await currentMemberCan("task:read"))) {
    return (
      <>
        <PageHeader
          title="To-Do"
          breadcrumbs={[{ label: "To-Dos", href: "/todos" }, { label: "Detail" }]}
        />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view this task."
        />
      </>
    );
  }

  const [task, options] = await Promise.all([getTaskById(id), listTaskOptions()]);
  if (!task) notFound();

  return <TaskDetail task={task} options={options} />;
}
