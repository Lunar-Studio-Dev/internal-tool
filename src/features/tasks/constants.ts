import { Priority, TaskStatus } from "@/generated/prisma/enums";

export const PRIORITY_ORDER: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Derived grouping bucket (never stored). */
export type TaskBucket = "OVERDUE" | "TODAY" | "TOMORROW" | "UPCOMING" | "NO_DUE" | "DONE";

export const TASK_BUCKET_LABELS: Record<TaskBucket, string> = {
  OVERDUE: "Overdue",
  TODAY: "Today",
  TOMORROW: "Tomorrow",
  UPCOMING: "Upcoming",
  NO_DUE: "No due date",
  DONE: "Completed",
};

export const TASK_BUCKET_ORDER: TaskBucket[] = [
  "OVERDUE",
  "TODAY",
  "TOMORROW",
  "UPCOMING",
  "NO_DUE",
  "DONE",
];

/**
 * Classify a task into a derived bucket. `dueAt` is an ISO string (or null).
 * Completed/Cancelled tasks are "DONE"; otherwise bucket by due date.
 */
export function bucketOfTask(task: { status: TaskStatus; dueAt: string | null }): TaskBucket {
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return "DONE";
  if (!task.dueAt) return "NO_DUE";

  const due = new Date(task.dueAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfDayAfter = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000);

  if (due < startOfToday) return "OVERDUE";
  if (due < startOfTomorrow) return "TODAY";
  if (due < startOfDayAfter) return "TOMORROW";
  return "UPCOMING";
}
