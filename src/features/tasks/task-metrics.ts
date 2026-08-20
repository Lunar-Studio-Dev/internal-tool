import { isSameDay, startOfDay } from "date-fns";

import { bucketOfTask } from "@/features/tasks/constants";
import type { TaskRow } from "@/features/tasks/components/task-list";
import type { TaskStatus } from "@/generated/prisma/enums";

export type TaskMetrics = {
  open: number;
  overdue: number;
  dueToday: number;
  inProgress: number;
  completed: number;
  nextDue: TaskRow | null;
};

export function isTaskOpen(task: { status: TaskStatus }): boolean {
  return task.status !== "COMPLETED" && task.status !== "CANCELLED";
}

export function isTaskOverdue(task: { status: TaskStatus; dueAt: string | null }): boolean {
  if (!isTaskOpen(task)) return false;
  return bucketOfTask(task) === "OVERDUE";
}

export function computeTaskMetrics(items: TaskRow[]): TaskMetrics {
  const todayStart = startOfDay(new Date());

  let open = 0;
  let overdue = 0;
  let dueToday = 0;
  let inProgress = 0;
  let completed = 0;
  let nextDue: TaskRow | null = null;

  for (const item of items) {
    if (!isTaskOpen(item)) {
      completed += 1;
      continue;
    }

    open += 1;
    if (item.status === "IN_PROGRESS") inProgress += 1;

    if (item.dueAt) {
      const due = new Date(item.dueAt);
      if (bucketOfTask(item) === "OVERDUE") overdue += 1;
      if (isSameDay(due, todayStart)) dueToday += 1;
      if (!nextDue || due < new Date(nextDue.dueAt!)) {
        nextDue = item;
      }
    }
  }

  return { open, overdue, dueToday, inProgress, completed, nextDue };
}

export type TaskFilter = "all" | "open" | "overdue" | "due_today" | "completed" | "in_progress";

export function filterTasks(items: TaskRow[], filter: TaskFilter): TaskRow[] {
  const todayStart = startOfDay(new Date());

  switch (filter) {
    case "open":
      return items.filter((item) => isTaskOpen(item));
    case "overdue":
      return items.filter((item) => isTaskOverdue(item));
    case "due_today":
      return items.filter(
        (item) =>
          isTaskOpen(item) && item.dueAt && isSameDay(new Date(item.dueAt), todayStart),
      );
    case "completed":
      return items.filter((item) => !isTaskOpen(item));
    case "in_progress":
      return items.filter((item) => item.status === "IN_PROGRESS");
    default:
      return items;
  }
}
