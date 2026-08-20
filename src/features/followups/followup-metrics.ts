import { isSameDay, isBefore, startOfDay } from "date-fns";

import type { FollowUpRow } from "@/features/followups/components/followup-list";

export type FollowUpMetrics = {
  pending: number;
  overdue: number;
  dueToday: number;
  completed: number;
  rescheduled: number;
  nextDue: FollowUpRow | null;
};

export function computeFollowUpMetrics(items: FollowUpRow[]): FollowUpMetrics {
  const now = new Date();
  const todayStart = startOfDay(now);

  const pendingItems = items.filter((item) => !item.completedAt);
  const completed = items.length - pendingItems.length;

  let overdue = 0;
  let dueToday = 0;
  let rescheduled = 0;
  let nextDue: FollowUpRow | null = null;

  for (const item of pendingItems) {
    const due = new Date(item.dueAt);
    if (isBefore(due, now)) overdue += 1;
    if (isSameDay(due, todayStart)) dueToday += 1;
    rescheduled += item.rescheduleCount ?? 0;

    if (!nextDue || due < new Date(nextDue.dueAt)) {
      nextDue = item;
    }
  }

  return {
    pending: pendingItems.length,
    overdue,
    dueToday,
    completed,
    rescheduled,
    nextDue,
  };
}

export type FollowUpFilter = "all" | "pending" | "overdue" | "completed";

export function filterFollowUps(items: FollowUpRow[], filter: FollowUpFilter): FollowUpRow[] {
  const now = new Date();
  switch (filter) {
    case "pending":
      return items.filter((item) => !item.completedAt);
    case "overdue":
      return items.filter((item) => !item.completedAt && isBefore(new Date(item.dueAt), now));
    case "completed":
      return items.filter((item) => Boolean(item.completedAt));
    default:
      return items;
  }
}

export function isFollowUpOverdue(item: FollowUpRow): boolean {
  if (item.completedAt) return false;
  return isBefore(new Date(item.dueAt), new Date());
}
