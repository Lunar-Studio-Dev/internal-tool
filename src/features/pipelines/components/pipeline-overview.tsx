"use client";

import type { ReactNode } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  ListTodoIcon,
} from "lucide-react";

import { ActivityList, type ActivityItem } from "@/components/common/activity-list";
import { QuerySection } from "@/components/common/query-gate";
import { ActivityListSkeleton } from "@/components/common/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeFollowUpMetrics } from "@/features/followups/followup-metrics";
import { computeTaskMetrics } from "@/features/tasks/task-metrics";
import type { TaskStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

function KpiStat({
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
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        tone === "warning" && value !== 0 && "border-amber-500/40",
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

function MetricsCardSkeleton({ titleWidth = "w-32" }: { titleWidth?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <Skeleton className={cn("h-5", titleWidth)} />
        <Skeleton className="h-8 w-28" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border px-3 py-2">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PipelineOverview({
  tasks,
  followUps,
  activities,
  tasksPending,
  tasksError,
  tasksErrorObj,
  followUpsPending,
  followUpsError,
  followUpsErrorObj,
  activityPending,
  activityError,
  activityErrorObj,
  onOpenActivity,
  onOpenFollowUps,
  onOpenTasks,
}: {
  tasks: { id: string; status: TaskStatus; dueAt: string | null }[];
  followUps: {
    completedAt: string | Date | null;
    dueAt: string;
    rescheduleCount?: number;
  }[];
  activities: ActivityItem[];
  tasksPending: boolean;
  tasksError: boolean;
  tasksErrorObj: Error | null;
  followUpsPending: boolean;
  followUpsError: boolean;
  followUpsErrorObj: Error | null;
  activityPending: boolean;
  activityError: boolean;
  activityErrorObj: Error | null;
  onOpenActivity: () => void;
  onOpenFollowUps: () => void;
  onOpenTasks: () => void;
}) {
  const taskMetrics = computeTaskMetrics(
    tasks.map((t) => ({
      id: t.id,
      title: "",
      status: t.status,
      priority: "MEDIUM" as const,
      dueAt: t.dueAt,
      assigneeName: null,
    })),
  );
  const followUpMetrics = computeFollowUpMetrics(
    followUps.map((f) => ({
      id: "",
      reason: "",
      dueAt: f.dueAt,
      completedAt: f.completedAt as string | null,
      assigneeName: null,
      notes: null,
      rescheduleCount: f.rescheduleCount,
    })),
  );

  const recentActivity = activities.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <QuerySection
          isPending={followUpsPending}
          isError={followUpsError}
          error={followUpsErrorObj}
          skeleton={<MetricsCardSkeleton titleWidth="w-36" />}
          errorTitle="Could not load follow-ups"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base">Follow-up metrics</CardTitle>
              <Button variant="outline" size="sm" onClick={onOpenFollowUps}>
                View follow-ups
                <ArrowRightIcon className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <KpiStat icon={ClockIcon} label="Pending" value={followUpMetrics.pending} />
              <KpiStat
                icon={AlertCircleIcon}
                label="Overdue"
                value={followUpMetrics.overdue}
                tone="warning"
                hint={followUpMetrics.overdue > 0 ? "Needs attention" : undefined}
              />
              <KpiStat
                icon={CalendarClockIcon}
                label="Due today"
                value={followUpMetrics.dueToday}
                hint={
                  followUpMetrics.nextDue
                    ? `Next: ${format(new Date(followUpMetrics.nextDue.dueAt), "d MMM, HH:mm")}`
                    : undefined
                }
              />
              <KpiStat
                icon={CheckCircle2Icon}
                label="Completed"
                value={followUpMetrics.completed}
                hint={
                  followUpMetrics.rescheduled > 0
                    ? `${followUpMetrics.rescheduled} total reschedules`
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </QuerySection>

        <QuerySection
          isPending={tasksPending}
          isError={tasksError}
          error={tasksErrorObj}
          skeleton={<MetricsCardSkeleton titleWidth="w-28" />}
          errorTitle="Could not load tasks"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base">Task metrics</CardTitle>
              <Button variant="outline" size="sm" onClick={onOpenTasks}>
                View tasks
                <ArrowRightIcon className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <KpiStat icon={ListTodoIcon} label="Open" value={taskMetrics.open} />
              <KpiStat
                icon={AlertCircleIcon}
                label="Overdue"
                value={taskMetrics.overdue}
                tone="warning"
                hint={taskMetrics.overdue > 0 ? "Needs attention" : undefined}
              />
              <KpiStat
                icon={CalendarClockIcon}
                label="Due today"
                value={taskMetrics.dueToday}
                hint={
                  taskMetrics.nextDue?.dueAt
                    ? `Next: ${format(new Date(taskMetrics.nextDue.dueAt), "d MMM, HH:mm")}`
                    : undefined
                }
              />
              <KpiStat
                icon={CheckCircle2Icon}
                label="Completed"
                value={taskMetrics.completed}
                hint={
                  taskMetrics.inProgress > 0 ? `${taskMetrics.inProgress} in progress` : undefined
                }
              />
            </CardContent>
          </Card>
        </QuerySection>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
          {!activityPending && !activityError && activities.length > 5 ? (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={onOpenActivity}>
              View all
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <QuerySection
            isPending={activityPending}
            isError={activityError}
            error={activityErrorObj}
            skeleton={<ActivityListSkeleton />}
            errorTitle="Could not load activity"
          >
            <ActivityList items={recentActivity} emptyDescription="Pipeline changes will appear here." />
            {recentActivity.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Last update{" "}
                {formatDistanceToNow(new Date(recentActivity[0]!.createdAt), { addSuffix: true })}
              </p>
            ) : null}
          </QuerySection>
        </CardContent>
      </Card>
    </div>
  );
}
