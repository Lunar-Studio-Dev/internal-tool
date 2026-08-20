"use client";

import { useQuery } from "@tanstack/react-query";
import { UploadIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { QueryGate } from "@/components/common/query-gate";
import { Button } from "@/components/ui/button";
import { resourceQueries } from "@/features/resources/api";
import {
  ResourceLibraryTable,
  type ResourceRow,
} from "@/features/resources/components/resource-library-table";
import { UploadDialog } from "@/features/resources/components/upload-dialog";
import { useCan } from "@/features/team/hooks/use-current-member";

export function ResourcesView() {
  const listQuery = useQuery(resourceQueries.list());
  const canWrite = useCan("resource:write");
  const rows: ResourceRow[] = (listQuery.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    contentType: r.contentType,
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
      <QueryGate isPending={listQuery.isPending} isError={listQuery.isError} error={listQuery.error}>
        <ResourceLibraryTable resources={rows} canWrite={canWrite} />
      </QueryGate>
    </>
  );
}
