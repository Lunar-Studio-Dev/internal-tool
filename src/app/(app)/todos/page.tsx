import type { Metadata } from "next";
import { ListTodoIcon, ShieldIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
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

  return (
    <>
      <PageHeader
        title="To-Dos"
        description="Tasks across every client, pipeline, and project."
        breadcrumbs={[{ label: "To-Dos" }]}
      />
      <ComingSoon
        icon={ListTodoIcon}
        title="To-Dos are on the way"
        description="Assign, track, and complete work across every client, pipeline, and project — without losing the thread."
        features={[
          "Assign tasks to team members with due dates",
          "Overdue alerts and priority filters",
          "Link tasks to businesses, pipelines, and projects",
          "Personal and team-wide task views",
        ]}
      />
    </>
  );
}
