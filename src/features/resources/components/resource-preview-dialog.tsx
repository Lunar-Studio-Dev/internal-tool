"use client";

import { DownloadIcon, Maximize2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RESOURCE_TYPE_LABELS, humanFileSize, resourceFilePath } from "@/features/resources/constants";
import {
  ResourcePreviewPane,
  type ResourcePreviewTarget,
} from "@/features/resources/components/resource-preview-pane";
import Link from "next/link";

export type { ResourcePreviewTarget };

export function ResourcePreviewDialog({
  resource,
  open,
  onOpenChange,
}: {
  resource: ResourcePreviewTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const downloadHref = resource ? resourceFilePath(resource.id, true) : "#";
  const fullscreenHref = resource ? `/resources/${resource.id}` : "#";
  const sizeLabel = resource ? humanFileSize(resource.sizeBytes) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        {resource ? (
          <>
            <DialogHeader className="border-b p-4 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="truncate">{resource.name}</DialogTitle>
                <Badge variant="secondary" className="font-normal">
                  {RESOURCE_TYPE_LABELS[resource.type]}
                </Badge>
              </div>
              <DialogDescription>
                {sizeLabel && sizeLabel !== "—" ? `${sizeLabel} · ` : null}
                Preview stays in the app. Use Full screen for a larger view.
              </DialogDescription>
            </DialogHeader>
            <div className="relative flex min-h-[60vh] flex-1 items-stretch overflow-hidden bg-muted/30">
              <ResourcePreviewPane key={resource.id} resource={resource} />
            </div>
            <DialogFooter>
              <Button variant="outline" asChild>
                <Link href={fullscreenHref}>
                  <Maximize2Icon className="size-4" />
                  Full screen
                </Link>
              </Button>
              <Button asChild>
                <a href={downloadHref}>
                  <DownloadIcon className="size-4" />
                  Download
                </a>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
