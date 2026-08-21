"use client";

import { useQuery } from "@tanstack/react-query";

import { GroupedBarChart } from "@/components/common/chart/simple-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountQueries } from "@/features/accounts/api";
import { formatINR } from "@/features/phases/constants";

export function EarningsVsExpensesChart() {
  const query = useQuery(accountQueries.earningsVsExpenses());

  if (query.isPending) {
    return <ChartSkeleton title="Earnings vs expenses" />;
  }

  if (query.isError || !query.data?.length) {
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

  const labels = query.data.map((row) => row.label);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Earnings vs expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <GroupedBarChart
          labels={labels}
          series={[
            {
              key: "earning",
              label: "Income",
              values: query.data.map((row) => row.earningPaise),
              className: "bg-emerald-500 dark:bg-emerald-400",
            },
            {
              key: "expense",
              label: "Expense",
              values: query.data.map((row) => row.expensePaise),
              className: "bg-rose-500 dark:bg-rose-400",
            },
          ]}
          valueFormatter={formatINR}
        />
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
        <div className="h-44 animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}
