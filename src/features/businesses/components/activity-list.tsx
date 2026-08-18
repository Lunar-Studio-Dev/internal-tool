import { formatDistanceToNow } from "date-fns";
import { ActivityIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import type { BusinessActivityItem } from "@/features/businesses/server/businesses.queries";

const ACTION_LABELS: Record<string, string> = {
  "business.created": "created this business",
  "business.updated": "updated the business info",
  "contact.created": "added a contact",
  "contact.created_primary": "added a primary contact",
  "contact.updated": "updated a contact",
  "contact.primary_changed": "changed the primary contact",
};

function label(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, " ");
}

export function ActivityList({ items }: { items: BusinessActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Changes to this business will appear here."
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
