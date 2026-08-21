"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { revenueChartConfig } from "@/components/common/chart/chart-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { accountQueries } from "@/features/accounts/api";
import { formatINR } from "@/features/phases/constants";

export function RevenueByMonthChart() {
  const query = useQuery(accountQueries.revenueByMonth());

  const chartData = useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        label: row.label,
        revenue: row.amountPaise,
      })),
    [query.data],
  );

  if (query.isPending) {
    return <ChartSkeleton title="Revenue by month" />;
  }

  if (query.isError || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No income recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue by month</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={revenueChartConfig}
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
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
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
