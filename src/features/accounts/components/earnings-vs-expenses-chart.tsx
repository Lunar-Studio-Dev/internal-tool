"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { incomeExpenseChartConfig } from "@/components/common/chart/chart-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { accountQueries } from "@/features/accounts/api";
import { formatINR } from "@/features/phases/constants";

export function EarningsVsExpensesChart() {
  const query = useQuery(accountQueries.earningsVsExpenses());

  const chartData = useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        label: row.label,
        earning: row.earningPaise,
        expense: row.expensePaise,
      })),
    [query.data],
  );

  if (query.isPending) {
    return <ChartSkeleton title="Earnings vs expenses" />;
  }

  if (query.isError || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings vs expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transaction data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Earnings vs expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={incomeExpenseChartConfig}
          className="aspect-auto h-[11rem] w-full"
        >
          <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatINR(Number(value))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="earning"
              fill="var(--color-earning)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              fill="var(--color-expense)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[11rem] animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}
