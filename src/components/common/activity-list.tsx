import { formatDistanceToNow } from "date-fns";
import { ActivityIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { activityLabel } from "@/lib/activity-labels";

export type ActivityItem = {
  id: string;
  action: string;
  createdAt: string | Date;
  actorName: string | null;
};

export function ActivityList({
  items,
  emptyDescription = "Changes will appear here.",
}: {
  items: ActivityItem[];
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState icon={ActivityIcon} title="No activity yet" description={emptyDescription} />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 text-sm">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
          <div className="flex flex-col">
            <span>
              <span className="font-medium">{item.actorName ?? "Someone"}</span>{" "}
              {activityLabel(item.action)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
