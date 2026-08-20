"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileQuestionIcon, Loader2Icon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import {
  previewKind,
  resourceFilePath,
} from "@/features/resources/constants";
import type { ResourceType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query/keys";

export type ResourcePreviewTarget = {
  id: string;
  name: string;
  type: ResourceType;
  contentType?: string | null;
  sizeBytes?: number | null;
};

function FileLoading({ label = "Loading file…" }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-muted/30 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function TextPreview({ id, url }: { id: string; url: string }) {
  const query = useQuery({
    queryKey: queryKeys.resources.fileText(id),
    queryFn: async ({ signal }) => {
      const res = await fetch(url, { credentials: "include", signal });
      if (!res.ok) throw new Error("Could not load file.");
      return res.text();
    },
  });

  return (
    <div className="relative h-full min-h-[60vh] w-full">
      {query.isPending ? <FileLoading /> : null}
      {query.isError ? (
        <EmptyState
          className="h-full border-0"
          title="Could not load"
          description={query.error.message}
        />
      ) : null}
      {query.data != null ? (
        <pre className="h-full overflow-auto whitespace-pre-wrap p-4 font-mono text-sm">{query.data}</pre>
      ) : null}
    </div>
  );
}

function MediaPreview({
  kind,
  url,
  name,
}: {
  kind: "image" | "pdf";
  url: string;
  name: string;
}) {
  const [activeUrl, setActiveUrl] = useState(url);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  if (url !== activeUrl) {
    setActiveUrl(url);
    setStatus("loading");
  }

  return (
    <div className="relative h-full min-h-[60vh] w-full">
      {status === "loading" ? <FileLoading /> : null}
      {status === "error" ? (
        <EmptyState
          className="h-full border-0"
          title="Could not load"
          description="The file could not be displayed. Try downloading it instead."
        />
      ) : null}
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className={cn(
            "absolute inset-0 m-auto max-h-full max-w-full object-contain",
            status === "ready" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      ) : (
        <iframe
          title={name}
          src={url}
          onLoad={() => setStatus("ready")}
          className={cn(
            "absolute inset-0 h-full w-full border-0",
            status === "ready" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      )}
    </div>
  );
}

export function ResourcePreviewPane({ resource }: { resource: ResourcePreviewTarget }) {
  const kind = previewKind(resource.contentType, resource.name);
  const fileUrl = resourceFilePath(resource.id);

  if (kind === "image" || kind === "pdf") {
    return <MediaPreview kind={kind} url={fileUrl} name={resource.name} />;
  }
  if (kind === "text") {
    return <TextPreview id={resource.id} url={fileUrl} />;
  }

  return (
    <EmptyState
      className="h-full border-0"
      icon={FileQuestionIcon}
      title="Preview not available"
      description="This file type can’t be shown here. Download it to open in another app."
    />
  );
}
