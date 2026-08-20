import type { ReactNode } from "react";
import { format } from "date-fns";
import { FolderClosedIcon, ListTodoIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PhaseStatus } from "@/generated/prisma/enums";

/**
 * WF-16 — generic phase view reused by the phase-specific screens in PHASE_7.
 * Renders phase info + task/resource slots (empty for now) and a footer for the
 * Deactivate / Promote actions passed in by the caller.
 */
export function PhaseViewShell({
  phaseLabel,
  phaseStatus,
  startedAt,
  ownerName,
  notes,
  work,
  actions,
}: {
  phaseLabel: string;
  phaseStatus: PhaseStatus | null;
  startedAt: Date | null;
  ownerName: string | null;
  notes: string | null;
  /** Phase tasks / resources / follow-ups panel. Falls back to empty slots. */
  work?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{phaseLabel}</CardTitle>
        {phaseStatus ? <StatusBadge kind={phaseStatus} /> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Started</span>
            <span className="text-sm">
              {startedAt ? format(startedAt, "d MMM yyyy") : <span className="text-muted-foreground">—</span>}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Owner</span>
            <span className="text-sm">
              {ownerName ?? <span className="text-muted-foreground">Unassigned</span>}
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-1">
            <span className="text-xs text-muted-foreground">Notes</span>
            <span className="text-sm">
              {notes ? notes : <span className="text-muted-foreground">—</span>}
            </span>
          </div>
        </div>

        {work ?? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium">Phase tasks</p>
              <EmptyState icon={ListTodoIcon} title="No tasks yet" description="Phase tasks appear here." />
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium">Phase resources</p>
              <EmptyState
                icon={FolderClosedIcon}
                title="No resources yet"
                description="Phase resources appear here."
              />
            </div>
          </div>
        )}

        {actions ? <div className="border-t pt-4">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
