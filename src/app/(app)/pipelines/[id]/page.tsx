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
import { listFollowUpsForPipeline } from "@/features/followups/server/followups.queries";
import {
  listResourceOptions,
  listResourcesForPipeline,
} from "@/features/resources/server/resources.queries";
import { listTaskOptions, listTasksForPipeline } from "@/features/tasks/server/tasks.queries";
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

  const [activity, reasons, canWrite, canTaskWrite, canResourceWrite, tasks, resources, followUps] =
    await Promise.all([
      getPipelineActivity(id),
      listDeactivationReasons(),
      currentMemberCan("pipeline:write"),
      currentMemberCan("task:write"),
      currentMemberCan("resource:write"),
      listTasksForPipeline(id),
      listResourcesForPipeline(id),
      listFollowUpsForPipeline(id),
    ]);

  const taskOptions = canTaskWrite ? await listTaskOptions() : null;
  const resourceOptions = canResourceWrite ? await listResourceOptions() : null;

  return (
    <PipelineDetail
      pipeline={pipeline}
      activity={activity}
      reasons={reasons.map((r) => ({ id: r.id, label: r.label }))}
      canWrite={canWrite}
      canTaskWrite={canTaskWrite}
      canResourceWrite={canResourceWrite}
      taskOptions={taskOptions}
      resourceOptions={resourceOptions}
      members={taskOptions?.members ?? []}
      phaseTasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueAt: t.dueAt,
      }))}
      phaseResources={resources.map((r) => ({ id: r.id, name: r.name, type: r.type }))}
      phaseFollowUps={followUps.map((f) => ({
        id: f.id,
        reason: f.reason,
        dueAt: f.dueAt.toISOString(),
        completedAt: f.completedAt ? f.completedAt.toISOString() : null,
        assigneeName: f.assigneeName,
        notes: f.notes,
      }))}
    />
  );
}
