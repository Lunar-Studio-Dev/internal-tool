import type { Metadata } from "next";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { CreatePipelineForm } from "@/features/pipelines/components/create-pipeline-form";
import {
  listActiveMembersForAssignee,
  listBusinessOptions,
} from "@/features/pipelines/server/pipelines.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Pipeline" };

export default async function NewPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  if (!(await currentMemberCan("pipeline:write"))) {
    return (
      <>
        <PageHeader
          title="New Pipeline"
          breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: "New" }]}
        />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to create pipelines."
        />
      </>
    );
  }

  const { businessId } = await searchParams;
  const [businesses, assignees] = await Promise.all([
    listBusinessOptions(),
    listActiveMembersForAssignee(),
  ]);
  const fixed = businessId ? businesses.find((b) => b.id === businessId) : undefined;

  return (
    <>
      <PageHeader
        title="New Pipeline"
        description="Start a new opportunity for a business. It begins at Discovery."
        breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: "New" }]}
      />
      <div className="max-w-2xl">
        <CreatePipelineForm
          businesses={businesses}
          assignees={assignees}
          fixedBusiness={fixed ? { id: fixed.id, name: fixed.name } : null}
        />
      </div>
    </>
  );
}
