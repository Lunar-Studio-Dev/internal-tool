"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIcon,
  CheckCircle2Icon,
  PauseCircleIcon,
  PlusIcon,
  SearchIcon,
  WorkflowIcon,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { MetricCard } from "@/components/common/metric-card";
import { QueryGate } from "@/components/common/query-gate";
import { TablePageSkeleton } from "@/components/common/skeletons";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pipelineQueries } from "@/features/pipelines/api";
import { PipelineCreateDialog } from "@/features/pipelines/components/pipeline-create-dialog";
import {
  PHASE_LABELS,
  PIPELINE_STATUS_OPTIONS,
  WORKABLE_PHASES,
} from "@/features/pipelines/constants";
import {
  computePipelineListMetrics,
  filterPipelineList,
  pipelineListFilterToStatus,
  type PipelineListFilter,
} from "@/features/pipelines/pipeline-list-metrics";
import { useCan } from "@/features/team/hooks/use-current-member";
import { PhaseType, PipelineStatus } from "@/generated/prisma/enums";

export type PipelineRow = {
  id: string;
  code: string;
  businessId: string;
  businessName: string;
  name: string;
  currentPhase: PhaseType;
  status: PipelineStatus;
  ownerName: string;
  createdAt: string;
};

export function PipelineTable() {
  const query = useQuery(pipelineQueries.list());
  const canWrite = useCan("pipeline:write");
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<"ALL" | PhaseType>("ALL");
  const [status, setStatus] = useState<"ALL" | PipelineStatus>("ALL");
  const [owner, setOwner] = useState<"ALL" | string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [listFilter, setListFilter] = useState<PipelineListFilter>("all");

  const pipelines: PipelineRow[] = useMemo(
    () =>
      (query.data ?? []).map((p) => ({
        id: p.id,
        code: p.code,
        businessId: p.businessId,
        businessName: p.business.name,
        name: p.name,
        currentPhase: p.currentPhase,
        status: p.status,
        ownerName: p.ownerName ?? "",
        createdAt: p.createdAt,
      })),
    [query.data],
  );

  const owners = useMemo(
    () => [...new Set(pipelines.map((p) => p.ownerName).filter(Boolean))].sort(),
    [pipelines],
  );

  const metrics = useMemo(() => computePipelineListMetrics(pipelines), [pipelines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statusFromList = pipelineListFilterToStatus(listFilter);
    const effectiveStatus = status !== "ALL" ? status : statusFromList;

    return filterPipelineList(pipelines, listFilter).filter((p) => {
      if (q && !`${p.code} ${p.businessName} ${p.name} ${p.ownerName}`.toLowerCase().includes(q)) {
        return false;
      }
      if (phase !== "ALL" && p.currentPhase !== phase) return false;
      if (effectiveStatus !== "ALL" && p.status !== effectiveStatus) return false;
      if (owner !== "ALL" && p.ownerName !== owner) return false;
      if (fromDate && p.createdAt.slice(0, 10) < fromDate) return false;
      if (toDate && p.createdAt.slice(0, 10) > toDate) return false;
      return true;
    });
  }, [pipelines, search, phase, status, owner, fromDate, toDate, listFilter]);

  const columns: DataTableColumn<PipelineRow>[] = [
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
      id: "business",
      header: "Business",
      cell: (p) => (
        <Link href={`/businesses/${p.businessId}`} className="hover:underline">
          {p.businessName}
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
      id: "owner",
      header: "Owner",
      cell: (p) => (p.ownerName ? p.ownerName : <span className="text-muted-foreground">—</span>),
    },
  ];

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<TablePageSkeleton columns={6} />}
    >
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ActivityIcon}
          label="Active"
          value={metrics.active}
          hint={metrics.activeHint ?? undefined}
          onClick={() => {
            setListFilter("active");
            setStatus("ALL");
          }}
        />
        <MetricCard
          icon={WorkflowIcon}
          label="In progress"
          value={metrics.inProgress}
          hint={metrics.inProgressHint ?? undefined}
          onClick={() => {
            setListFilter("in_progress");
            setStatus("ALL");
          }}
        />
        <MetricCard
          icon={CheckCircle2Icon}
          label="Completed"
          value={metrics.completed}
          hint={metrics.completed > 0 ? "Won opportunities" : "None yet"}
          tone={metrics.completed > 0 ? "success" : "default"}
          onClick={() => {
            setListFilter("completed");
            setStatus("ALL");
          }}
        />
        <MetricCard
          icon={PauseCircleIcon}
          label="Deactivated"
          value={metrics.deactivated}
          hint={metrics.deactivated > 0 ? "Preserved history" : "None deactivated"}
          tone={metrics.deactivated > 0 ? "warning" : "default"}
          onClick={() => {
            setListFilter("deactivated");
            setStatus("ALL");
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, business, opportunity…"
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
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as "ALL" | PipelineStatus);
            setListFilter("all");
          }}
        >
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
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-40"
          aria-label="Created from"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-40"
          aria-label="Created to"
        />
        {canWrite ? (
          <PipelineCreateDialog
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                New Pipeline
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
    </QueryGate>
  );
}
