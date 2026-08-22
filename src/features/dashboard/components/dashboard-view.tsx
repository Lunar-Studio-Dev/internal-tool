"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2Icon,
  CalendarClockIcon,
  FolderKanbanIcon,
  ListTodoIcon,
  PlusIcon,
  TrendingUpIcon,
  WalletIcon,
  WorkflowIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";

import { pipelineChartConfig } from "@/components/common/chart/chart-theme";
import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { QueryGate } from "@/components/common/query-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { dashboardQueries, type DashboardDataDto } from "@/features/dashboard/api";
import { PHASE_LABELS, PIPELINE_STATUS_LABELS } from "@/features/pipelines/constants";
import { TASK_BUCKET_LABELS, type TaskBucket } from "@/features/tasks/constants";
import type { PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { formatINR } from "@/features/phases/constants";
import { useCurrentMember } from "@/features/team/hooks/use-current-member";
import { formatDistanceToNow } from "date-fns";

export function DashboardView() {
  const member = useCurrentMember();
  const query = useQuery(dashboardQueries.data());
  const firstName = member.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            Your client management overview at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/businesses">
              <PlusIcon className="size-4" />
              Business
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/pipelines">
              <WorkflowIcon className="size-4" />
              Pipelines
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/todos">
              <ListTodoIcon className="size-4" />
              My tasks
            </Link>
          </Button>
        </div>
      </div>

      <QueryGate
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        skeleton={
          <div className={METRIC_GRID_CLASS}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        }
      >
        <div className={METRIC_GRID_CLASS}>
          <MetricCard
            icon={Building2Icon}
            label="Businesses"
            value={String(query.data?.kpis.businesses ?? 0)}
          />
          <MetricCard
            icon={WorkflowIcon}
            label="Active pipelines"
            value={String(query.data?.kpis.activePipelines ?? 0)}
          />
          <MetricCard
            icon={FolderKanbanIcon}
            label="Active projects"
            value={String(query.data?.kpis.activeProjects ?? 0)}
          />
          <MetricCard
            icon={TrendingUpIcon}
            label="Pipeline value"
            value={formatINR(query.data?.kpis.pipelineValuePaise ?? 0)}
          />
          <MetricCard
            icon={WalletIcon}
            label="Total revenue"
            value={formatINR(query.data?.kpis.revenuePaise ?? 0)}
            tone="success"
          />
        </div>
      </QueryGate>

      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineFunnelCard funnel={query.data?.funnel ?? []} loading={query.isPending} />
        <PipelineStatusCard
          breakdown={query.data?.statusBreakdown ?? []}
          loading={query.isPending}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My to-dos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/todos">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(query.data?.myTasks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks assigned to you.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {(query.data?.myTasks ?? []).map((task: DashboardDataDto["myTasks"][number]) => (
                  <li key={task.id}>
                    <Link
                      href={`/todos?task=${task.id}`}
                      className="flex flex-col gap-0.5 rounded-md p-2 transition-colors hover:bg-muted/60"
                    >
                      <span className="text-sm font-medium">{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {TASK_BUCKET_LABELS[task.bucket as TaskBucket]}
                        {task.dueAt
                          ? ` · ${formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent pipelines</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pipelines">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(query.data?.recentPipelines ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pipelines yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {(query.data?.recentPipelines ?? []).map((p: DashboardDataDto["recentPipelines"][number]) => (
                  <li key={p.id}>
                    <Link
                      href={`/pipelines/${p.id}`}
                      className="flex items-start justify-between gap-2 rounded-md p-2 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{p.code}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.businessName} · {PHASE_LABELS[p.currentPhase as PhaseType]}
                        </span>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {PIPELINE_STATUS_LABELS[p.status as PipelineStatus]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClockIcon className="size-4" />
              Upcoming follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(query.data?.followUps ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming follow-ups.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {(query.data?.followUps ?? []).map((f: DashboardDataDto["followUps"][number]) => (
                  <li key={f.id}>
                    <Link
                      href={f.pipelineId ? `/pipelines/${f.pipelineId}` : `/businesses/${f.businessId}`}
                      className="flex flex-col gap-0.5 rounded-md p-2 transition-colors hover:bg-muted/60"
                    >
                      <span className="text-sm font-medium">{f.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {f.businessName ?? f.pipelineCode}
                        {f.dueAt
                          ? ` · ${formatDistanceToNow(new Date(f.dueAt), { addSuffix: true })}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PipelineFunnelCard({
  funnel,
  loading,
}: {
  funnel: Array<{ phase: string; label: string; count: number }>;
  loading: boolean;
}) {
  if (loading) return <ChartSkeleton title="Pipeline funnel" />;

  const data = funnel.filter((f) => f.count > 0);
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active pipelines in the funnel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={pipelineChartConfig} className="aspect-auto h-[11rem] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={4}>
              {data.map((_, i) => (
                <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-2 flex flex-wrap gap-2">
          {funnel.map((f) => (
            <span key={f.phase} className="text-xs text-muted-foreground">
              {f.label}: <strong className="text-foreground">{f.count}</strong>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineStatusCard({
  breakdown,
  loading,
}: {
  breakdown: Array<{ status: string; label: string; count: number }>;
  loading: boolean;
}) {
  if (loading) return <ChartSkeleton title="Pipeline status" />;

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pipeline data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline status</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ChartContainer config={pipelineChartConfig} className="mx-auto aspect-square h-[10rem]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={breakdown}
              dataKey="count"
              nameKey="label"
              innerRadius={40}
              strokeWidth={2}
            />
          </PieChart>
        </ChartContainer>
        <ul className="flex flex-col gap-2 text-sm">
          {breakdown.map((b) => (
            <li key={b.status} className="flex items-center justify-between gap-4">
              <span>{b.label}</span>
              <span className="font-semibold tabular-nums">{b.count}</span>
            </li>
          ))}
        </ul>
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
