"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
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
import {
  PHASE_LABELS,
  PHASE_ORDER,
  PIPELINE_STATUS_OPTIONS,
} from "@/features/pipelines/constants";
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
};

export function PipelineTable({ pipelines }: { pipelines: PipelineRow[] }) {
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<"ALL" | PhaseType>("ALL");
  const [status, setStatus] = useState<"ALL" | PipelineStatus>("ALL");
  const [owner, setOwner] = useState<"ALL" | string>("ALL");

  const owners = useMemo(
    () => [...new Set(pipelines.map((p) => p.ownerName).filter(Boolean))].sort(),
    [pipelines],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pipelines.filter((p) => {
      if (q && !`${p.code} ${p.businessName} ${p.name} ${p.ownerName}`.toLowerCase().includes(q)) {
        return false;
      }
      if (phase !== "ALL" && p.currentPhase !== phase) return false;
      if (status !== "ALL" && p.status !== status) return false;
      if (owner !== "ALL" && p.ownerName !== owner) return false;
      return true;
    });
  }, [pipelines, search, phase, status, owner]);

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
    <div className="flex flex-col gap-4">
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
            {PHASE_ORDER.map((p) => (
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
        <Button asChild>
          <Link href="/pipelines/new">
            <PlusIcon className="size-4" />
            New Pipeline
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(p) => p.id}
        empty="No pipelines match your filters."
      />
    </div>
  );
}
