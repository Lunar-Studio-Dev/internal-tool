"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { EyeIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteResource } from "@/features/resources/api";
import { ResourcePreviewDialog } from "@/features/resources/components/resource-preview-dialog";
import { RESOURCE_TYPE_LABELS, humanFileSize } from "@/features/resources/constants";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import type { PhaseType, ResourceType } from "@/generated/prisma/enums";

export type ResourceListItem = {
  id: string;
  name: string;
  type: ResourceType;
  contentType?: string | null;
  sizeBytes?: number | null;
  phaseType?: PhaseType | null;
  createdAt?: string | null;
  pipelineId?: string | null;
  pipelineCode?: string | null;
};

function ResourceRowItem({
  item,
  canWrite,
  showPipeline,
  onOpen,
}: {
  item: ResourceListItem;
  canWrite: boolean;
  showPipeline?: boolean;
  onOpen: () => void;
}) {
  const deleteResource = useDeleteResource();

  async function remove() {
    try {
      await deleteResource.mutateAsync(item.id);
      toast.success("Resource deleted");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="truncate text-left text-sm font-medium hover:underline"
            onClick={onOpen}
          >
            {item.name}
          </button>
          <Badge variant="secondary" className="font-normal">
            {RESOURCE_TYPE_LABELS[item.type]}
          </Badge>
          {item.phaseType ? (
            <Badge variant="outline" className="font-normal">
              {PHASE_LABELS[item.phaseType]}
            </Badge>
          ) : null}
          {showPipeline && item.pipelineCode && item.pipelineId ? (
            <Badge variant="outline" className="font-normal">
              <Link href={`/pipelines/${item.pipelineId}`} className="hover:underline">
                {item.pipelineCode}
              </Link>
            </Badge>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {humanFileSize(item.sizeBytes)}
          {item.createdAt
            ? ` · Added ${format(new Date(item.createdAt), "d MMM yyyy")}`
            : ""}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          <EyeIcon className="size-4" />
          Open
        </Button>
        {canWrite ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${item.name}`}
                disabled={deleteResource.isPending}
              >
                {deleteResource.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{item.name}&quot; and its stored file will be permanently removed. This
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void remove()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}

export function ResourceList({
  items,
  canWrite,
  showPipeline = false,
  emptyDescription = "Resources for this pipeline will appear here.",
}: {
  items: ResourceListItem[];
  canWrite: boolean;
  showPipeline?: boolean;
  emptyDescription?: string;
}) {
  const [preview, setPreview] = useState<ResourceListItem | null>(null);

  if (items.length === 0) {
    return <EmptyState title="No resources" description={emptyDescription} />;
  }

  return (
    <>
      <div className="divide-y rounded-lg border px-3">
        {items.map((item) => (
          <ResourceRowItem
            key={item.id}
            item={item}
            canWrite={canWrite}
            showPipeline={showPipeline}
            onOpen={() => setPreview(item)}
          />
        ))}
      </div>
      <ResourcePreviewDialog
        resource={preview}
        open={preview !== null}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
      />
    </>
  );
}
