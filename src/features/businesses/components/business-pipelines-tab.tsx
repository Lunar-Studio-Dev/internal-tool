"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ActivityIcon,
  CheckCircle2Icon,
  IndianRupeeIcon,
  PauseCircleIcon,
  PlusIcon,
  SearchIcon,
  WorkflowIcon,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { MetricCard } from "@/components/common/metric-card";
import { QuerySection } from "@/components/common/query-gate";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessQueries } from "@/features/businesses/api";
import {
  computeBusinessPipelineMetrics,
  filterBusinessPipelines,
  type BusinessPipelineFilter,
  type BusinessPipelineRow,
} from "@/features/businesses/business-pipeline-metrics";
import { CLIENT_DECISION_LABELS } from "@/features/phases/quotation-metrics";
import { formatINR } from "@/features/phases/constants";
import { CompletePipelineDialog } from "@/features/pipelines/components/complete-pipeline-dialog";
import { PipelineCreateDialog } from "@/features/pipelines/components/pipeline-create-dialog";
import {
  canCompletePipeline,
  PHASE_LABELS,
  PIPELINE_STATUS_OPTIONS,
  WORKABLE_PHASES,
} from "@/features/pipelines/constants";
import type { PhaseType, PipelineStatus } from "@/generated/prisma/enums";

const KPI_FILTERS: { value: BusinessPipelineFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
  { value: "in_progress", label: "In progress" },
  { value: "handed_off", label: "Handed off" },
];

export function BusinessPipelinesTab({
  businessId,
  canWrite,
}: {
  businessId: string;
  canWrite: boolean;
}) {
  const pipelinesQuery = useQuery(businessQueries.pipelines(businessId));
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<"ALL" | PhaseType>("ALL");
  const [status, setStatus] = useState<"ALL" | PipelineStatus>("ALL");
  const [owner, setOwner] = useState<"ALL" | string>("ALL");
  const [chipFilter, setChipFilter] = useState<BusinessPipelineFilter>("all");

  const pipelines: BusinessPipelineRow[] = useMemo(
    () =>
      (pipelinesQuery.data ?? []).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        currentPhase: p.currentPhase,
        status: p.status,
        ownerName: p.ownerName,
        createdAt: p.createdAt,
        decision: p.decision,
        handedOff: p.handedOff,
        quotationSubtotal: p.quotationSubtotal,
      })),
    [pipelinesQuery.data],
  );

  const metrics = useMemo(() => computeBusinessPipelineMetrics(pipelines), [pipelines]);

  const owners = useMemo(
    () => [...new Set(pipelines.map((p) => p.ownerName).filter(Boolean))].sort() as string[],
    [pipelines],
  );

  const filtered = useMemo(() => {
    let rows = filterBusinessPipelines(pipelines, chipFilter);
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (q && !`${p.code} ${p.name} ${p.ownerName ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      if (phase !== "ALL" && p.currentPhase !== phase) return false;
      if (status !== "ALL" && p.status !== status) return false;
      if (owner !== "ALL" && p.ownerName !== owner) return false;
      return true;
    });
  }, [pipelines, chipFilter, search, phase, status, owner]);

  const columns: DataTableColumn<BusinessPipelineRow>[] = useMemo(
    () => [
      {
        id: "code",
        header: "ID",
        cell: (p) => (
          <Link href={`/pipelines/${p.id}`} className="font-medium hover:underline">
            {p.code}
          </Link>
        ),
      },
      {
        id: "opportunity",
        header: "Opportunity",
        cell: (p) => (
          <Link href={`/pipelines/${p.id}`} className="hover:underline">
            {p.name}
          </Link>
        ),
      },
      { id: "phase", header: "Phase", cell: (p) => PHASE_LABELS[p.currentPhase] },
      { id: "status", header: "Status", cell: (p) => <StatusBadge kind={p.status} /> },
      {
        id: "decision",
        header: "Decision",
        cell: (p) =>
          p.decision ? (
            <Badge variant={p.decision === "ACCEPTED" ? "default" : "secondary"} className="font-normal">
              {CLIENT_DECISION_LABELS[p.decision]}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "value",
        header: "Value",
        cell: (p) =>
          p.quotationSubtotal != null ? (
            formatINR(p.quotationSubtotal)
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "owner",
        header: "Owner",
        cell: (p) => p.ownerName ?? <span className="text-muted-foreground">—</span>,
      },
      {
        id: "created",
        header: "Created",
        cell: (p) => (
          <span className="text-muted-foreground">
            {format(new Date(p.createdAt), "d MMM yyyy")}
          </span>
        ),
      },
      ...(canWrite
        ? [
            {
              id: "actions",
              header: "",
              headerClassName: "w-32",
              className: "w-32 text-right",
              cell: (p: BusinessPipelineRow) =>
                canCompletePipeline({
                  status: p.status,
                  currentPhase: p.currentPhase,
                  handedOff: p.handedOff,
                }) ? (
                  <CompletePipelineDialog
                    pipelineId={p.id}
                    pipelineLabel={`${p.code} · ${p.name}`}
                    trigger={
                      <Button variant="outline" size="sm">
                        <CheckCircle2Icon className="size-4" />
                        Complete
                      </Button>
                    }
                  />
                ) : null,
            } satisfies DataTableColumn<BusinessPipelineRow>,
          ]
        : []),
    ],
    [canWrite],
  );

  return (
    <QuerySection
      isPending={pipelinesQuery.isPending}
      isError={pipelinesQuery.isError}
      error={pipelinesQuery.error}
      skeleton={
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-muted/30" />
            ))}
          </div>
        </div>
      }
      errorTitle="Could not load pipelines"
    >
      {pipelines.length === 0 ? (
        <div className="flex flex-col gap-4">
          {canWrite ? (
            <div className="flex justify-end">
              <PipelineCreateDialog
                businessId={businessId}
                trigger={
                  <Button size="sm">
                    <PlusIcon className="size-4" />
                    New pipeline
                  </Button>
                }
              />
            </div>
          ) : null}
          <EmptyState
            icon={WorkflowIcon}
            title="No pipelines yet"
            description="Create the first pipeline for this business."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={ActivityIcon}
              label="Active"
              value={metrics.active}
              hint={metrics.activeHint}
              onClick={() => setChipFilter("active")}
            />
            <MetricCard
              icon={PauseCircleIcon}
              label="Deactivated"
              value={metrics.deactivated}
              hint={metrics.deactivatedHint}
              tone={metrics.deactivated > 0 ? "warning" : "default"}
              onClick={() => setChipFilter("deactivated")}
            />
            <MetricCard
              icon={WorkflowIcon}
              label="In progress"
              value={metrics.inProgress}
              hint={metrics.inProgressHint ?? undefined}
              onClick={() => setChipFilter("in_progress")}
            />
            <MetricCard
              icon={IndianRupeeIcon}
              label="Pipeline value"
              value={formatINR(metrics.totalValuePaise)}
              hint={metrics.valueHint ?? undefined}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={chipFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setChipFilter("all")}
            >
              All
            </Button>
            {KPI_FILTERS.map((item) => (
              <Button
                key={item.value}
                variant={chipFilter === item.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChipFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, opportunity, owner…"
                className="pl-8"
              />
            </div>
            <Select value={phase} onValueChange={(v) => setPhase(v as "ALL" | PhaseType)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All phases</SelectItem>
                {WORKABLE_PHASES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PHASE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | PipelineStatus)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {PIPELINE_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {owners.length > 0 ? (
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All owners</SelectItem>
                  {owners.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {canWrite ? (
              <PipelineCreateDialog
                businessId={businessId}
                trigger={
                  <Button size="sm">
                    <PlusIcon className="size-4" />
                    New pipeline
                  </Button>
                }
              />
            ) : null}
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            getRowKey={(p) => p.id}
            empty="No pipelines match your filters."
          />
        </div>
      )}
    </QuerySection>
  );
}
