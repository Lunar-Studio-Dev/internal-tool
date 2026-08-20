"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  ListTodoIcon,
  WalletIcon,
  AlertCircleIcon,
} from "lucide-react";

import {
  MetricCard,
  MetricCardSkeleton,
  METRIC_GRID_CLASS,
} from "@/components/common/metric-card";
import { EmptyState } from "@/components/common/empty-state";
import { businessQueries } from "@/features/businesses/api";
import { computeBusinessOverviewKpis } from "@/features/businesses/business-overview-metrics";
import type { FollowUpRow } from "@/features/followups/components/followup-list";
import { formatINR } from "@/features/phases/constants";
import type { TaskRow } from "@/features/tasks/components/task-list";

export function BusinessOverviewKpis({
  businessId,
  onOpenActivity,
  onOpenTasks,
  onOpenFinancials,
}: {
  businessId: string;
  onOpenActivity?: () => void;
  onOpenTasks?: () => void;
  onOpenFinancials?: () => void;
}) {
  const followUpsQuery = useQuery(businessQueries.followUps(businessId));
  const tasksQuery = useQuery(businessQueries.tasks(businessId));
  const financialsQuery = useQuery(businessQueries.financials(businessId));

  const followUpRows: FollowUpRow[] = useMemo(
    () =>
      (followUpsQuery.data ?? []).map((f) => ({
        id: f.id,
        reason: f.reason,
        dueAt: f.dueAt,
        completedAt: f.completedAt,
        assigneeName: f.assigneeName,
        notes: f.notes,
        phaseType: f.phaseType,
        assigneeId: f.assigneeId,
        rescheduleCount: f.rescheduleCount,
      })),
    [followUpsQuery.data],
  );

  const taskRows: TaskRow[] = useMemo(
    () =>
      (tasksQuery.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt,
        assigneeName: t.assigneeName,
        phaseType: t.phaseType,
      })),
    [tasksQuery.data],
  );

  const kpis = useMemo(
    () => computeBusinessOverviewKpis(followUpRows, taskRows),
    [followUpRows, taskRows],
  );

  const opsPending = followUpsQuery.isPending || tasksQuery.isPending;
  const opsError = followUpsQuery.isError || tasksQuery.isError;
  const financialsPending = financialsQuery.isPending;
  const financialsError = financialsQuery.isError;

  if (opsPending || financialsPending) {
    return (
      <div className={METRIC_GRID_CLASS}>
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (opsError && financialsError) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Could not load overview metrics"
        description={
          followUpsQuery.error?.message ??
          tasksQuery.error?.message ??
          financialsQuery.error?.message ??
          "Something went wrong."
        }
      />
    );
  }

  return (
    <div className={METRIC_GRID_CLASS}>
      {opsError ? (
        <div className="col-span-2 flex items-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground xl:col-span-3">
          Could not load follow-up and task metrics.
        </div>
      ) : (
        <>
          <MetricCard
            icon={CalendarCheckIcon}
            label="Recent follow-ups"
            value={kpis.recentFollowUps.count}
            hint={kpis.recentFollowUps.hint}
            onClick={onOpenActivity}
          />
          <MetricCard
            icon={CalendarClockIcon}
            label="Upcoming follow-ups"
            value={kpis.upcomingFollowUps.count}
            hint={kpis.upcomingFollowUps.hint}
            tone={kpis.upcomingFollowUps.overdue > 0 ? "warning" : "default"}
            onClick={onOpenActivity}
          />
          <MetricCard
            icon={ListTodoIcon}
            label="Pending tasks"
            value={kpis.pendingTasks.count}
            hint={kpis.pendingTasks.hint}
            tone={kpis.pendingTasks.overdue > 0 ? "warning" : "default"}
            onClick={onOpenTasks}
          />
        </>
      )}

      {financialsError ? (
        <div className="flex items-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Could not load revenue.
        </div>
      ) : (
        <MetricCard
          icon={WalletIcon}
          label="Total revenue"
          value={formatINR(financialsQuery.data?.totalPaise ?? 0)}
          hint={
            (financialsQuery.data?.projectCount ?? 0) > 0
              ? `From ${financialsQuery.data!.projectCount} completed project${financialsQuery.data!.projectCount === 1 ? "" : "s"}`
              : "No completed projects yet"
          }
          onClick={onOpenFinancials}
        />
      )}
    </div>
  );
}
