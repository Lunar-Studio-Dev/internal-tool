"use client";

import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4">
        <div className="size-8 rounded-md bg-muted" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-5 w-10 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
