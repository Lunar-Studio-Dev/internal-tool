"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertCircleIcon, CalendarClockIcon, CheckCircle2Icon, ClockIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FollowUpFormDialog } from "@/features/followups/components/followup-form-dialog";
import { FollowUpList, type FollowUpRow } from "@/features/followups/components/followup-list";
import {
  computeFollowUpMetrics,
  filterFollowUps,
  type FollowUpFilter,
} from "@/features/followups/followup-metrics";
import type { PhaseType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
}) {
  return (
    <Card className={cn(tone === "warning" && value !== "0" && value !== 0 && "border-amber-500/40")}>
      <CardContent className="flex items-start gap-3 pt-4">
        <div className="rounded-md bg-muted p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const FILTERS: { value: FollowUpFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

export function PipelineFollowUpsTab({
  pipelineId,
  businessId,
  currentPhase,
  followUps,
  canWrite,
  deactivated,
}: {
  pipelineId: string;
  businessId: string;
  currentPhase: PhaseType;
  followUps: FollowUpRow[];
  canWrite: boolean;
  deactivated: boolean;
}) {
  const [filter, setFilter] = useState<FollowUpFilter>("all");
  const metrics = useMemo(() => computeFollowUpMetrics(followUps), [followUps]);
  const filtered = useMemo(() => filterFollowUps(followUps, filter), [followUps, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClockIcon} label="Pending" value={metrics.pending} />
        <MetricCard
          icon={AlertCircleIcon}
          label="Overdue"
          value={metrics.overdue}
          tone="warning"
          hint={metrics.overdue > 0 ? "Needs attention" : undefined}
        />
        <MetricCard
          icon={CalendarClockIcon}
          label="Due today"
          value={metrics.dueToday}
          hint={
            metrics.nextDue
              ? `Next: ${format(new Date(metrics.nextDue.dueAt), "d MMM, HH:mm")}`
              : undefined
          }
        />
        <MetricCard
          icon={CheckCircle2Icon}
          label="Completed"
          value={metrics.completed}
          hint={metrics.rescheduled > 0 ? `${metrics.rescheduled} total reschedules` : undefined}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button
              key={item.value}
              variant={filter === item.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {canWrite && !deactivated ? (
          <FollowUpFormDialog
            businessId={businessId}
            pipelineId={pipelineId}
            phaseType={currentPhase}
            trigger={
              <Button size="sm">
                <PlusIcon className="size-4" />
                Schedule follow-up
              </Button>
            }
          />
        ) : null}
      </div>

      <FollowUpList
        items={filtered}
        canWrite={canWrite && !deactivated}
        businessId={businessId}
        pipelineId={pipelineId}
        emptyDescription={
          filter === "all"
            ? "No follow-ups for this pipeline yet."
            : `No ${filter} follow-ups.`
        }
      />
    </div>
  );
}
