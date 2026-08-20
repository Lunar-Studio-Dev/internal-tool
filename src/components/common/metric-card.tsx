"use client";

import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** 2×2 on mobile/tablet, single row of 4 on xl+. Equal-height rows. */
export const METRIC_GRID_CLASS =
  "grid grid-cols-2 auto-rows-fr gap-2 sm:gap-3 xl:grid-cols-4";

export function MetricGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(METRIC_GRID_CLASS, className)}>{children}</div>;
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string | null;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "success";
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const warning = tone === "warning" && value !== "0" && value !== 0;

  return (
    <Card
      className={cn(
        "h-full",
        tone === "success" && "border-emerald-500/40",
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
      <CardContent className="flex h-full flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3 sm:p-4 sm:pt-4">
        <div className="w-fit shrink-0 rounded-md bg-muted p-1.5 sm:p-2">
          <Icon className="size-3.5 text-muted-foreground sm:size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">{label}</p>
          <p className="text-base font-semibold tabular-nums sm:text-sm">{value}</p>
          <p className="min-h-4 truncate text-[11px] text-muted-foreground sm:text-xs">
            {hint ?? "\u00A0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3 sm:p-4 sm:pt-4">
        <div className="size-7 shrink-0 rounded-md bg-muted sm:size-8" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-5 w-10 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
