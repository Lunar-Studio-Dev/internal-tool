import { NotAuthorized } from "@/components/layout/not-authorized";
import { TaskDetail } from "@/features/tasks/components/task-detail";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await currentMemberCan("task:read"))) {
    return (
      <NotAuthorized
        title="To-Do"
        description="You don't have permission to view this task."
        breadcrumbs={[{ label: "To-Dos", href: "/todos" }, { label: "Detail" }]}
      />
    );
  }

  return <TaskDetail id={id} />;
}
