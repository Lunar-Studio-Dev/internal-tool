import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { PipelineTable } from "@/features/pipelines/components/pipeline-table";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pipelines" };

export default async function PipelinesPage() {
  if (!(await currentMemberCan("pipeline:read"))) {
    return (
      <NotAuthorized
        title="Pipelines"
        description="You don't have permission to view pipelines."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Pipelines"
        description="Track opportunities as they move from Discovery to Project."
        breadcrumbs={[{ label: "Pipelines" }]}
      />
      <PipelineTable />
    </>
  );
}
