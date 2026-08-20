import { NotAuthorized } from "@/components/layout/not-authorized";
import { PipelineDetail } from "@/features/pipelines/components/pipeline-detail";
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
      <NotAuthorized
        title="Pipeline"
        description="You don't have permission to view this pipeline."
        breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: "Detail" }]}
      />
    );
  }

  return <PipelineDetail id={id} />;
}
