import { format, formatDistanceToNow, isBefore, subDays } from "date-fns";

import type { FollowUpRow } from "@/features/followups/components/followup-list";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { computeTaskMetrics, isTaskOpen, isTaskOverdue } from "@/features/tasks/task-metrics";
import type { TaskRow } from "@/features/tasks/components/task-list";
import type { PhaseType } from "@/generated/prisma/enums";

const RECENT_WINDOW_DAYS = 7;

export type BusinessOverviewKpiSnapshot = {
  recentFollowUps: {
    count: number;
    hint: string;
  };
  upcomingFollowUps: {
    count: number;
    overdue: number;
    hint: string;
  };
  pendingTasks: {
    count: number;
    overdue: number;
    hint: string;
  };
};

function phaseHint(phaseType: PhaseType | null | undefined): string | null {
  if (!phaseType) return null;
  return PHASE_LABELS[phaseType];
}

function withPhase(base: string, phaseType: PhaseType | null | undefined): string {
  const phase = phaseHint(phaseType);
  return phase ? `${base} · ${phase}` : base;
}

export function computeBusinessOverviewKpis(
  followUps: FollowUpRow[],
  tasks: TaskRow[],
  now = new Date(),
): BusinessOverviewKpiSnapshot {
  const recentSince = subDays(now, RECENT_WINDOW_DAYS);

  const recentCompleted = followUps
    .filter((f) => f.completedAt && new Date(f.completedAt) >= recentSince)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const upcoming = followUps
    .filter((f) => !f.completedAt && !isBefore(new Date(f.dueAt), now))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const overdueFollowUps = followUps.filter(
    (f) => !f.completedAt && isBefore(new Date(f.dueAt), now),
  );

  const pendingTasks = tasks.filter((t) => isTaskOpen(t));
  const taskMetrics = computeTaskMetrics(tasks);
  const overdueTasks = pendingTasks.filter((t) => isTaskOverdue(t));
  const nextPendingWithPhase = pendingTasks
    .filter((t) => t.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0];

  let recentHint = "None this week";
  if (recentCompleted[0]?.completedAt) {
    recentHint = withPhase(
      `Last: ${formatDistanceToNow(new Date(recentCompleted[0].completedAt), { addSuffix: true })}`,
      recentCompleted[0].phaseType,
    );
  }

  let upcomingHint = "No upcoming follow-ups";
  if (overdueFollowUps.length > 0 && !upcoming[0]) {
    upcomingHint = `${overdueFollowUps.length} overdue`;
  } else if (upcoming[0]) {
    upcomingHint = withPhase(
      `Next: ${format(new Date(upcoming[0].dueAt), "d MMM, HH:mm")}`,
      upcoming[0].phaseType,
    );
    if (overdueFollowUps.length > 0) {
      upcomingHint = `${upcomingHint} · ${overdueFollowUps.length} overdue`;
    }
  } else if (overdueFollowUps.length > 0) {
    upcomingHint = `${overdueFollowUps.length} overdue`;
  }

  let pendingHint = "No open tasks";
  if (overdueTasks.length > 0) {
    pendingHint = withPhase(
      `${overdueTasks.length} overdue`,
      overdueTasks[0]?.phaseType ?? nextPendingWithPhase?.phaseType,
    );
  } else if (taskMetrics.nextDue?.dueAt) {
    pendingHint = withPhase(
      `Next: ${format(new Date(taskMetrics.nextDue.dueAt), "d MMM, HH:mm")}`,
      taskMetrics.nextDue.phaseType,
    );
  } else if (pendingTasks[0]) {
    pendingHint = withPhase("No due date", pendingTasks[0].phaseType);
  }

  return {
    recentFollowUps: {
      count: recentCompleted.length,
      hint: recentHint,
    },
    upcomingFollowUps: {
      count: upcoming.length,
      overdue: overdueFollowUps.length,
      hint: upcomingHint,
    },
    pendingTasks: {
      count: pendingTasks.length,
      overdue: overdueTasks.length,
      hint: pendingHint,
    },
  };
}
