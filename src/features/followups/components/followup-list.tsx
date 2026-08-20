"use client";

import { format } from "date-fns";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompleteFollowUp } from "@/features/followups/api";
import { mutationErrorMessage } from "@/lib/api/errors";

export type FollowUpRow = {
  id: string;
  reason: string;
  dueAt: string;
  completedAt: string | null;
  assigneeName: string | null;
  notes: string | null;
};

function FollowUpRowItem({ item, canWrite }: { item: FollowUpRow; canWrite: boolean }) {
  const completeFollowUp = useCompleteFollowUp();
  const done = Boolean(item.completedAt);

  async function complete() {
    try {
      await completeFollowUp.mutateAsync(item.id);
      toast.success("Follow-up completed");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={`text-sm ${done ? "text-muted-foreground line-through" : "font-medium"}`}>
          {item.reason}
        </span>
        <span className="text-xs text-muted-foreground">
          Due {format(new Date(item.dueAt), "d MMM yyyy, HH:mm")}
          {item.assigneeName ? ` · ${item.assigneeName}` : ""}
        </span>
        {item.notes ? <span className="text-xs text-muted-foreground">{item.notes}</span> : null}
      </div>
      {done ? (
        <Badge variant="secondary" className="shrink-0 font-normal">
          Done
        </Badge>
      ) : canWrite ? (
        <Button variant="ghost" size="sm" disabled={completeFollowUp.isPending} onClick={complete}>
          <CheckIcon className="size-4" />
          Mark done
        </Button>
      ) : null}
    </div>
  );
}

export function FollowUpList({ items, canWrite }: { items: FollowUpRow[]; canWrite: boolean }) {
  if (items.length === 0) {
    return <EmptyState title="No follow-ups" description="Scheduled follow-ups will appear here." />;
  }
  return (
    <div className="divide-y rounded-lg border px-3">
      {items.map((item) => (
        <FollowUpRowItem key={item.id} item={item} canWrite={canWrite} />
      ))}
    </div>
  );
}
