"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BusinessRow = {
  id: string;
  name: string;
  website: string;
  industry: string;
  primaryContact: string;
  pipelineCount: number;
  activePipelineCount: number;
};

export function BusinessTable({ businesses }: { businesses: BusinessRow[] }) {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<"ALL" | string>("ALL");

  const industries = useMemo(
    () => [...new Set(businesses.map((b) => b.industry).filter(Boolean))].sort(),
    [businesses],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      if (q && !`${b.name} ${b.website} ${b.primaryContact}`.toLowerCase().includes(q)) {
        return false;
      }
      if (industry !== "ALL" && b.industry !== industry) return false;
      return true;
    });
  }, [businesses, search, industry]);

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
    <div className="flex flex-col gap-4">
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
        <Button asChild>
          <Link href="/businesses/new">
            <PlusIcon className="size-4" />
            New Business
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(b) => b.id}
        empty="No businesses match your filters."
      />
    </div>
  );
}
