import type { ChartConfig } from "@/components/ui/chart";

/** Shared chart colors — uses CSS tokens from globals.css (light/dark aware). */
export const incomeExpenseChartConfig = {
  earning: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Expense",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export const pipelineChartConfig = {
  count: {
    label: "Pipelines",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;
