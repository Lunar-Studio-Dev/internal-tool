import type { Metadata } from "next";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PipelineTable, type PipelineRow } from "@/features/pipelines/components/pipeline-table";
import { listPipelines } from "@/features/pipelines/server/pipelines.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pipelines" };

export default async function PipelinesPage() {
  if (!(await currentMemberCan("pipeline:read"))) {
    return (
      <>
        <PageHeader title="Pipelines" breadcrumbs={[{ label: "Pipelines" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view pipelines."
        />
      </>
    );
  }

  const pipelines = await listPipelines();
  const rows: PipelineRow[] = pipelines.map((p) => ({
    id: p.id,
    code: p.code,
    businessId: p.businessId,
    businessName: p.business.name,
    name: p.name,
    currentPhase: p.currentPhase,
    status: p.status,
    ownerName: p.ownerName ?? "",
  }));

  return (
    <>
      <PageHeader
        title="Pipelines"
        description="Track opportunities as they move from Discovery to Project."
        breadcrumbs={[{ label: "Pipelines" }]}
      />
      <PipelineTable pipelines={rows} />
    </>
  );
}
