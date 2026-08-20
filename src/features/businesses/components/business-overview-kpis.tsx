"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  ListTodoIcon,
  WalletIcon,
} from "lucide-react";

import {
  MetricCard,
  MetricCardSkeleton,
  METRIC_GRID_CLASS,
} from "@/components/common/metric-card";
import { QuerySection } from "@/components/common/query-gate";
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
  const opsErrorObj = followUpsQuery.error ?? tasksQuery.error;

  return (
    <div className={METRIC_GRID_CLASS}>
      <QuerySection
        isPending={opsPending}
        isError={opsError}
        error={opsErrorObj}
        skeleton={
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        }
        errorTitle="Could not load overview metrics"
      >
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
      </QuerySection>

      <QuerySection
        isPending={financialsQuery.isPending}
        isError={financialsQuery.isError}
        error={financialsQuery.error}
        skeleton={<MetricCardSkeleton />}
        errorTitle="Could not load revenue"
      >
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
      </QuerySection>
    </div>
  );
}
