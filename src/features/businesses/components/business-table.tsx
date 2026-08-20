"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2Icon,
  PlusIcon,
  SearchIcon,
  WorkflowIcon,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { MetricCard } from "@/components/common/metric-card";
import { QueryGate } from "@/components/common/query-gate";
import { TablePageSkeleton } from "@/components/common/skeletons";
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
  computeBusinessListMetrics,
  filterBusinessList,
  type BusinessListFilter,
} from "@/features/businesses/business-list-metrics";
import { BusinessCreateDialog } from "@/features/businesses/components/business-create-dialog";
import { useCan } from "@/features/team/hooks/use-current-member";

export type BusinessRow = {
  id: string;
  name: string;
  website: string;
  industry: string;
  primaryContact: string;
  pipelineCount: number;
  activePipelineCount: number;
};

export function BusinessTable() {
  const query = useQuery(businessQueries.list());
  const canWrite = useCan("business:write");
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<"ALL" | string>("ALL");
  const [listFilter, setListFilter] = useState<BusinessListFilter>("all");

  const businesses: BusinessRow[] = useMemo(
    () =>
      (query.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        website: b.website ?? "",
        industry: b.industry ?? "",
        primaryContact: b.contacts[0]?.name ?? "",
        pipelineCount: b.pipelines.length,
        activePipelineCount: b.pipelines.filter((p) => p.status === "ACTIVE").length,
      })),
    [query.data],
  );

  const industries = useMemo(
    () => [...new Set(businesses.map((b) => b.industry).filter(Boolean))].sort(),
    [businesses],
  );

  const metrics = useMemo(() => computeBusinessListMetrics(businesses), [businesses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filterBusinessList(businesses, listFilter).filter((b) => {
      if (q && !`${b.name} ${b.website} ${b.primaryContact}`.toLowerCase().includes(q)) {
        return false;
      }
      if (industry !== "ALL" && b.industry !== industry) return false;
      return true;
    });
  }, [businesses, search, industry, listFilter]);

  const columns: DataTableColumn<BusinessRow>[] = [
    {
      id: "name",
      header: "Business",
      cell: (b) => (
        <Link href={`/businesses/${b.id}`} className="font-medium hover:underline">
          {b.name}
        </Link>
      ),
    },
    {
      id: "website",
      header: "Website",
      cell: (b) =>
        b.website ? (
          <span className="text-muted-foreground">{b.website}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "contact",
      header: "Contact",
      cell: (b) =>
        b.primaryContact ? b.primaryContact : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "pipelines",
      header: "Pipelines",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (b) => b.pipelineCount,
    },
    {
      id: "active",
      header: "Active",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (b) => b.activePipelineCount,
    },
    {
      id: "actions",
      header: "",
      headerClassName: "w-16",
      className: "w-16 text-right",
      cell: (b) => (
        <Link href={`/businesses/${b.id}`} className="text-sm text-muted-foreground hover:underline">
          View ›
        </Link>
      ),
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
          icon={Building2Icon}
          label="Total businesses"
          value={metrics.total}
          hint="In your directory"
          onClick={() => setListFilter("all")}
        />
        <MetricCard
          icon={WorkflowIcon}
          label="With pipelines"
          value={metrics.withPipelines}
          hint={metrics.withPipelinesHint ?? undefined}
          onClick={() => setListFilter("with_pipelines")}
        />
        <MetricCard
          icon={WorkflowIcon}
          label="Active pipelines"
          value={metrics.activePipelines}
          hint={metrics.activeHint ?? undefined}
          tone={metrics.activePipelines > 0 ? "default" : "warning"}
          onClick={() => setListFilter("with_active")}
        />
        <MetricCard
          icon={Building2Icon}
          label="Total pipelines"
          value={metrics.totalPipelines}
          hint={`Across ${metrics.total} business${metrics.total === 1 ? "" : "es"}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, website, or contact…"
            className="pl-8"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All industries</SelectItem>
            {industries.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canWrite ? (
          <BusinessCreateDialog
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                New Business
              </Button>
            }
          />
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(b) => b.id}
        empty="No businesses match your filters."
      />
    </div>
    </QueryGate>
  );
}
