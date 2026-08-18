import { notFound } from "next/navigation";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PipelineDetail } from "@/features/pipelines/components/pipeline-detail";
import {
  getPipelineActivity,
  getPipelineById,
  listDeactivationReasons,
} from "@/features/pipelines/server/pipelines.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await currentMemberCan("pipeline:read"))) {
    return (
      <>
        <PageHeader
          title="Pipeline"
          breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: "Detail" }]}
        />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view this pipeline."
        />
      </>
    );
  }

  const pipeline = await getPipelineById(id);
  if (!pipeline) notFound();

  const [activity, reasons, canWrite] = await Promise.all([
    getPipelineActivity(id),
    listDeactivationReasons(),
    currentMemberCan("pipeline:write"),
  ]);

  return (
    <PipelineDetail
      pipeline={pipeline}
      activity={activity}
      reasons={reasons.map((r) => ({ id: r.id, label: r.label }))}
      canWrite={canWrite}
    />
  );
}
