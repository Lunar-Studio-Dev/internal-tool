"use client";

import { useQuery } from "@tanstack/react-query";

import { SimpleBarChart } from "@/components/common/chart/simple-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountQueries } from "@/features/accounts/api";
import { formatINR } from "@/features/phases/constants";

export function RevenueByMonthChart() {
  const query = useQuery(accountQueries.revenueByMonth());

  if (query.isPending) {
    return <ChartSkeleton title="Revenue by month" />;
  }

  if (query.isError || !query.data?.length) {
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
        <SimpleBarChart
          data={query.data.map((row) => ({ label: row.label, value: row.amountPaise }))}
          valueFormatter={formatINR}
          barClassName="bg-primary"
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
