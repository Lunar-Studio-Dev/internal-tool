"use client";

import { format } from "date-fns";
import { CheckIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowUpFormDialog } from "@/features/followups/components/followup-form-dialog";
import { isFollowUpOverdue } from "@/features/followups/followup-metrics";
import { useCompleteFollowUp } from "@/features/followups/api";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import type { PhaseType } from "@/generated/prisma/enums";

export type FollowUpRow = {
  id: string;
  reason: string;
  dueAt: string;
  completedAt: string | null;
  assigneeName: string | null;
  notes: string | null;
  phaseType?: PhaseType | null;
  assigneeId?: string | null;
  rescheduleCount?: number;
};

function FollowUpRowItem({
  item,
  canWrite,
  businessId,
  pipelineId,
}: {
  item: FollowUpRow;
  canWrite: boolean;
  businessId?: string | null;
  pipelineId?: string | null;
}) {
  const completeFollowUp = useCompleteFollowUp();
  const done = Boolean(item.completedAt);
  const overdue = isFollowUpOverdue(item);

  async function complete() {
    try {
      await completeFollowUp.mutateAsync(item.id);
      toast.success("Follow-up completed");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div
      className={`flex items-start justify-between gap-3 py-3 ${overdue ? "border-l-2 border-amber-500 pl-3" : ""}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm ${done ? "text-muted-foreground line-through" : "font-medium"}`}>
            {item.reason}
          </span>
          {item.phaseType ? (
            <Badge variant="secondary" className="font-normal">
              {PHASE_LABELS[item.phaseType]}
            </Badge>
          ) : null}
          {overdue ? (
            <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
              Overdue
            </Badge>
          ) : null}
          {(item.rescheduleCount ?? 0) > 0 ? (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Rescheduled {item.rescheduleCount}x
            </Badge>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          Due {format(new Date(item.dueAt), "d MMM yyyy, HH:mm")}
          {item.assigneeName ? ` · ${item.assigneeName}` : ""}
        </span>
        {item.notes ? <span className="text-xs text-muted-foreground">{item.notes}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {done ? (
          <Badge variant="secondary" className="font-normal">
            Done
          </Badge>
        ) : (
          <>
            {canWrite ? (
              <FollowUpFormDialog
                businessId={businessId}
                pipelineId={pipelineId}
                phaseType={item.phaseType}
                followUp={{
                  id: item.id,
                  reason: item.reason,
                  dueAt: item.dueAt,
                  assigneeId: item.assigneeId ?? null,
                  notes: item.notes,
                }}
                trigger={
                  <Button variant="ghost" size="sm">
                    <PencilIcon className="size-4" />
                    Edit
                  </Button>
                }
              />
            ) : null}
            {canWrite ? (
              <Button variant="ghost" size="sm" disabled={completeFollowUp.isPending} onClick={complete}>
                <CheckIcon className="size-4" />
                Mark done
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function FollowUpList({
  items,
  canWrite,
  businessId,
  pipelineId,
  emptyDescription = "Scheduled follow-ups will appear here.",
}: {
  items: FollowUpRow[];
  canWrite: boolean;
  businessId?: string | null;
  pipelineId?: string | null;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title="No follow-ups" description={emptyDescription} />;
  }
  return (
    <div className="divide-y rounded-lg border px-3">
      {items.map((item) => (
        <FollowUpRowItem
          key={item.id}
          item={item}
          canWrite={canWrite}
          businessId={businessId}
          pipelineId={pipelineId}
        />
      ))}
    </div>
  );
}
