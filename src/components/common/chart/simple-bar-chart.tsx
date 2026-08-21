"use client";

import { cn } from "@/lib/utils";

export type BarChartPoint = {
  label: string;
  value: number;
};

export function SimpleBarChart({
  data,
  className,
  valueFormatter,
  barClassName,
}: {
  data: BarChartPoint[];
  className?: string;
  valueFormatter?: (value: number) => string;
  barClassName?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex h-44 items-end gap-2 sm:gap-3", className)}>
      {data.map((point) => {
        const heightPct = point.value > 0 ? Math.max((point.value / max) * 100, 6) : 0;
        return (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end">
              <div
                className={cn("w-full rounded-t-md bg-primary transition-all", barClassName)}
                style={{ height: `${heightPct}%` }}
                title={valueFormatter ? valueFormatter(point.value) : String(point.value)}
              />
            </div>
            <span className="w-full truncate text-center text-[10px] text-muted-foreground sm:text-xs">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type GroupedBarChartSeries = {
  key: string;
  label: string;
  className: string;
};

export function GroupedBarChart({
  labels,
  series,
  className,
  valueFormatter,
}: {
  labels: string[];
  series: Array<{ key: string; label: string; values: number[]; className: string }>;
  className?: string;
  valueFormatter?: (value: number) => string;
}) {
  const max = Math.max(...series.flatMap((s) => s.values), 1);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", s.className)} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {labels.map((label, index) => (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              {series.map((s) => {
                const value = s.values[index] ?? 0;
                const heightPct = value > 0 ? Math.max((value / max) * 100, 6) : 0;
                return (
                  <div
                    key={s.key}
                    className={cn("flex-1 rounded-t-md", s.className)}
                    style={{ height: `${heightPct}%` }}
                    title={valueFormatter ? valueFormatter(value) : String(value)}
                  />
                );
              })}
            </div>
            <span className="w-full truncate text-center text-[10px] text-muted-foreground sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { GroupedBarChartSeries as ChartSeriesLegend };
