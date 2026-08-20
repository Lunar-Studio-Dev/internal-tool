"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  ListTodoIcon,
  WalletIcon,
} from "lucide-react";

import { QuerySection } from "@/components/common/query-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { businessQueries } from "@/features/businesses/api";
import { computeBusinessOverviewKpis } from "@/features/businesses/business-overview-metrics";
import type { FollowUpRow } from "@/features/followups/components/followup-list";
import { formatINR } from "@/features/phases/constants";
import type { TaskRow } from "@/features/tasks/components/task-list";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const warning = tone === "warning" && value !== "0" && value !== 0;

  return (
    <Card
      className={cn(
        warning && "border-amber-500/40",
        interactive && "cursor-pointer transition-colors hover:bg-muted/40",
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="flex items-start gap-3 pt-4">
        <div className="rounded-md bg-muted p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
