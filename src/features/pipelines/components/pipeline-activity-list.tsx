import { formatDistanceToNow } from "date-fns";
import { ActivityIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import type { PipelineActivityItem } from "@/features/pipelines/server/pipelines.queries";

const ACTION_LABELS: Record<string, string> = {
  "pipeline.created": "created this pipeline",
  "pipeline.promoted": "promoted the pipeline",
  "pipeline.deactivated": "deactivated the pipeline",
};

function label(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, " ");
}

export function PipelineActivityList({ items }: { items: PipelineActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Transitions and updates will appear here."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 text-sm">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
          <div className="flex flex-col">
            <span>
              <span className="font-medium">{item.actorName ?? "Someone"}</span> {label(item.action)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
