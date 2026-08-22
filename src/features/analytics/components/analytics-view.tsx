"use client";

import { useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  Building2Icon,
  ScaleIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
  WorkflowIcon,
} from "lucide-react";

import { pipelineChartConfig } from "@/components/common/chart/chart-theme";
import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { QueryGate } from "@/components/common/query-gate";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TabsContent } from "@/components/ui/tabs";
import { analyticsQueries, type AnalyticsPeriod } from "@/features/analytics/api";
import { EarningsVsExpensesChart } from "@/features/accounts/components/earnings-vs-expenses-chart";
import { RevenueByMonthChart } from "@/features/accounts/components/revenue-by-month-chart";
import { formatINR } from "@/features/phases/constants";
import { Button } from "@/components/ui/button";

type OverviewData = {
  overview?: {
    total: number;
    active: number;
    completed: number;
    deactivated: number;
    newLeads: number;
  };
  phaseDistribution?: Array<{ label: string; count: number }>;
  trend?: Array<{ label: string; active: number; completed: number; deactivated: number }>;
};

type PipelineData = {
  phaseDistribution?: Array<{ label: string; count: number }>;
  conversion?: Array<{ label: string; reached: number; rate: number }>;
  avgTime?: Array<{ label: string; avgDays: number }>;
  deactivations?: Array<{ label: string; usageCount: number; enabled: boolean }>;
  trend?: Array<{ label: string; active: number; completed: number; deactivated: number }>;
};

type FinancialData = {
  summary?: {
    earningPaise: number;
    expensePaise: number;
    netPaise: number;
    outstandingPaise: number;
  };
};

type TeamData = {
  workload?: Array<{
    name: string;
    activeTasks: number;
    overdue: number;
    pipelines: number;
    followUps: number;
  }>;
};

export function AnalyticsView() {
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState<AnalyticsPeriod>("monthly");
  const query = useQuery(analyticsQueries.tab(tab, period));

  return (
    <div className="flex flex-col gap-4">
      <SectionTabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTabsList>
            <SectionTabsTrigger value="overview">Overview</SectionTabsTrigger>
            <SectionTabsTrigger value="pipeline">Pipeline</SectionTabsTrigger>
            <SectionTabsTrigger value="financial">Financial</SectionTabsTrigger>
            <SectionTabsTrigger value="team">Team</SectionTabsTrigger>
          </SectionTabsList>
          {tab === "financial" ? (
            <div className="flex gap-1 rounded-md border p-0.5">
              {(["monthly", "quarterly", "yearly"] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? "secondary" : "ghost"}
                  className="h-7 capitalize"
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <TabsContent value="overview">
          <OverviewTab data={(query.data ?? {}) as OverviewData} query={query} />
        </TabsContent>
        <TabsContent value="pipeline">
          <PipelineTab data={(query.data ?? {}) as PipelineData} query={query} />
        </TabsContent>
        <TabsContent value="financial">
          <FinancialTab data={(query.data ?? {}) as FinancialData} />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab data={(query.data ?? {}) as TeamData} query={query} />
        </TabsContent>
      </SectionTabs>
    </div>
  );
}

function OverviewTab({
  data,
  query,
}: {
  data: OverviewData;
  query: UseQueryResult<Record<string, unknown>>;
}) {
  const o = data.overview;
  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error instanceof Error ? query.error : null}
    >
      <div className={METRIC_GRID_CLASS}>
        <MetricCard icon={WorkflowIcon} label="Total pipelines" value={String(o?.total ?? 0)} />
        <MetricCard icon={TrendingUpIcon} label="Active" value={String(o?.active ?? 0)} tone="success" />
        <MetricCard icon={Building2Icon} label="Completed" value={String(o?.completed ?? 0)} />
        <MetricCard icon={WorkflowIcon} label="Deactivated" value={String(o?.deactivated ?? 0)} tone="warning" />
        <MetricCard icon={UsersIcon} label="New leads" value={String(o?.newLeads ?? 0)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PhaseBarChart title="Phase distribution" data={data.phaseDistribution ?? []} />
        <TrendChart title="Pipeline trend (6 mo)" data={data.trend ?? []} />
      </div>
    </QueryGate>
  );
}

function PipelineTab({
  data,
  query,
}: {
  data: PipelineData;
  query: UseQueryResult<Record<string, unknown>>;
}) {
  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error instanceof Error ? query.error : null}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PhaseBarChart title="Pipelines by phase" data={data.phaseDistribution ?? []} />
        <ConversionChart data={data.conversion ?? []} />
        <AvgTimeChart data={data.avgTime ?? []} />
        <DeactivationChart data={data.deactivations ?? []} />
        <div className="lg:col-span-2">
          <TrendChart title="Monthly pipeline activity" data={data.trend ?? []} />
        </div>
      </div>
    </QueryGate>
  );
}

function FinancialTab({ data }: { data: FinancialData }) {
  const s = data.summary;
  return (
    <div className="flex flex-col gap-4">
      {s ? (
        <div className={METRIC_GRID_CLASS}>
          <MetricCard icon={ArrowUpCircleIcon} label="Earnings" value={formatINR(s.earningPaise)} tone="success" />
          <MetricCard icon={ArrowDownCircleIcon} label="Expenses" value={formatINR(s.expensePaise)} />
          <MetricCard
            icon={ScaleIcon}
            label="Net"
            value={formatINR(s.netPaise)}
            tone={s.netPaise >= 0 ? "success" : "warning"}
          />
          <MetricCard icon={WalletIcon} label="Outstanding" value={formatINR(s.outstandingPaise)} tone="warning" />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueByMonthChart />
        <EarningsVsExpensesChart />
      </div>
    </div>
  );
}

function TeamTab({
  data,
  query,
}: {
  data: TeamData;
  query: UseQueryResult<Record<string, unknown>>;
}) {
  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error instanceof Error ? query.error : null}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team workload</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Member</th>
                <th className="pb-2 pr-4 font-medium">Tasks</th>
                <th className="pb-2 pr-4 font-medium">Overdue</th>
                <th className="pb-2 pr-4 font-medium">Pipelines</th>
                <th className="pb-2 font-medium">Follow-ups</th>
              </tr>
            </thead>
            <tbody>
              {(data.workload ?? []).map((row) => (
                <tr key={row.name} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.name}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.activeTasks}</td>
                  <td className="py-2 pr-4 tabular-nums text-destructive">{row.overdue}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.pipelines}</td>
                  <td className="py-2 tabular-nums">{row.followUps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </QueryGate>
  );
}

function PhaseBarChart({ title, data }: { title: string; data: Array<{ label: string; count: number }> }) {
  if (data.every((d) => d.count === 0)) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No data yet.</p></CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={pipelineChartConfig} className="aspect-auto h-[11rem] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function TrendChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; active: number; completed: number; deactivated: number }>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={pipelineChartConfig} className="aspect-auto h-[11rem] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="active" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="completed" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="deactivated" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ConversionChart({ data }: { data: Array<{ label: string; rate: number }> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Conversion by phase</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={pipelineChartConfig} className="aspect-auto h-[11rem] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" hide />
            <YAxis unit="%" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="rate" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function AvgTimeChart({ data }: { data: Array<{ label: string; avgDays: number }> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Avg days in phase</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={pipelineChartConfig} className="aspect-auto h-[11rem] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="avgDays" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DeactivationChart({
  data,
}: {
  data: Array<{ label: string; usageCount: number; enabled: boolean }>;
}) {
  const filtered = data.filter((d) => d.usageCount > 0);
  if (filtered.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Deactivation reasons</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No deactivations recorded.</p></CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Deactivation reasons</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={pipelineChartConfig} className="aspect-auto h-[11rem] w-full">
          <BarChart data={filtered} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="usageCount" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
