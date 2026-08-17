import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for status colours across the app.
 * Covers pipeline phase statuses, task statuses, payment statuses, and priorities.
 */
export type StatusKind =
  | "ACTIVE"
  | "PROMOTED"
  | "DEACTIVATED"
  | "REACTIVATED"
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

const STYLES: Record<StatusKind, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PROMOTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  DEACTIVATED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  REACTIVATED: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PARTIAL: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const LABELS: Partial<Record<StatusKind, string>> = {
  IN_PROGRESS: "In progress",
  TODO: "To do",
};

function formatLabel(kind: StatusKind) {
  return LABELS[kind] ?? kind.charAt(0) + kind.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusBadge({ kind, className }: { kind: StatusKind; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", STYLES[kind], className)}>
      {formatLabel(kind)}
    </Badge>
  );
}
