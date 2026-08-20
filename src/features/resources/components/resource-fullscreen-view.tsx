"use client";

import { DownloadIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/page-header";
import { QueryGate } from "@/components/common/query-gate";
import { ResourceDetailSkeleton } from "@/components/common/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resourceQueries } from "@/features/resources/api";
import { ResourcePreviewPane } from "@/features/resources/components/resource-preview-pane";
import { RESOURCE_TYPE_LABELS, humanFileSize, resourceFilePath } from "@/features/resources/constants";

export function ResourceFullscreenView({ id }: { id: string }) {
  const query = useQuery(resourceQueries.detail(id));
  const resource = query.data;
  const sizeLabel = resource ? humanFileSize(resource.sizeBytes) : null;

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<ResourceDetailSkeleton />}
    >
      {resource ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <PageHeader
            title={resource.name}
            description={sizeLabel && sizeLabel !== "—" ? sizeLabel : undefined}
            breadcrumbs={[{ label: "Resources", href: "/resources" }, { label: resource.name }]}
            action={
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {RESOURCE_TYPE_LABELS[resource.type]}
                </Badge>
                <Button asChild>
                  <a href={resourceFilePath(resource.id, true)}>
                    <DownloadIcon className="size-4" />
                    Download
                  </a>
                </Button>
              </div>
            }
          />
          <div className="relative min-h-[calc(100dvh-12rem)] flex-1 overflow-hidden rounded-lg border bg-muted/30">
            <ResourcePreviewPane resource={resource} />
          </div>
        </div>
      ) : null}
    </QueryGate>
  );
}
