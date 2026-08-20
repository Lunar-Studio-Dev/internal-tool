import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { TaskDashboard } from "@/features/tasks/components/task-dashboard";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "To-Dos" };

export default async function TodosPage() {
  if (!(await currentMemberCan("task:read"))) {
    return (
      <NotAuthorized title="To-Dos" description="You don't have permission to view tasks." />
    );
  }

  return (
    <>
      <PageHeader
        title="My To-Dos"
        description="Tasks across every client, pipeline, and project."
        breadcrumbs={[{ label: "To-Dos" }]}
      />
      <TaskDashboard />
    </>
  );
}
