import type { Metadata } from "next";
import { ShieldIcon, UploadIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  ResourceLibraryTable,
  type ResourceRow,
} from "@/features/resources/components/resource-library-table";
import { UploadDialog } from "@/features/resources/components/upload-dialog";
import {
  listResourceOptions,
  listResources,
} from "@/features/resources/server/resources.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  if (!(await currentMemberCan("resource:read"))) {
    return (
      <>
        <PageHeader title="Resources" breadcrumbs={[{ label: "Resources" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view resources."
        />
      </>
    );
  }

  const [resources, options, canWrite] = await Promise.all([
    listResources(),
    listResourceOptions(),
    currentMemberCan("resource:write"),
  ]);

  const rows: ResourceRow[] = resources.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    sizeBytes: r.sizeBytes,
    businessId: r.businessId,
    businessName: r.businessName,
    pipelineId: r.pipelineId,
    pipelineCode: r.pipelineCode,
    phaseType: r.phaseType,
  }));

  return (
    <>
      <PageHeader
        title="Resources"
        description="A shared library of documents and files."
        breadcrumbs={[{ label: "Resources" }]}
        action={
          canWrite ? (
            <UploadDialog
              options={options}
              trigger={
                <Button>
                  <UploadIcon className="size-4" />
                  Upload
                </Button>
              }
            />
          ) : undefined
        }
      />
      <ResourceLibraryTable resources={rows} canWrite={canWrite} />
    </>
  );
}
