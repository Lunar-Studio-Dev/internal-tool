"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { DownloadIcon, Loader2Icon, SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_ORDER, humanFileSize } from "@/features/resources/constants";
import {
  deleteResourceAction,
  getResourceDownloadUrlAction,
} from "@/features/resources/server/resources.actions";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import type { PhaseType, ResourceType } from "@/generated/prisma/enums";

export type ResourceRow = {
  id: string;
  name: string;
  type: ResourceType;
  sizeBytes: number | null;
  businessId: string | null;
  businessName: string | null;
  pipelineId: string | null;
  pipelineCode: string | null;
  phaseType: PhaseType | null;
};

function ResourceRowActions({ resource, canWrite }: { resource: ResourceRow; canWrite: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function download() {
    startTransition(async () => {
      const result = await getResourceDownloadUrlAction(resource.id);
      if (result.ok) window.open(result.url, "_blank", "noopener,noreferrer");
      else toast.error(result.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteResourceAction(resource.id);
      if (result.ok) toast.success("Resource deleted");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" disabled={isPending} onClick={download}>
        {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
        Open
      </Button>
      {canWrite ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Delete ${resource.name}`} disabled={isPending}>
              <Trash2Icon className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{resource.name}&quot; and its stored file will be permanently removed. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

export function ResourceLibraryTable({
  resources,
  canWrite,
}: {
  resources: ResourceRow[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [business, setBusiness] = useState<"ALL" | string>("ALL");
  const [type, setType] = useState<"ALL" | ResourceType>("ALL");

  const businesses = useMemo(
    () =>
      [...new Map(
        resources
          .filter((r) => r.businessId)
          .map((r) => [r.businessId as string, r.businessName ?? r.businessId] as const),
      )].map(([id, name]) => ({ id, name })),
    [resources],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (business !== "ALL" && r.businessId !== business) return false;
      if (type !== "ALL" && r.type !== type) return false;
      return true;
    });
  }, [resources, search, business, type]);

  const columns: DataTableColumn<ResourceRow>[] = [
    { id: "name", header: "Resource", cell: (r) => <span className="font-medium">{r.name}</span> },
    {
      id: "type",
      header: "Type",
      cell: (r) => (
        <Badge variant="secondary" className="font-normal">
          {RESOURCE_TYPE_LABELS[r.type]}
        </Badge>
      ),
    },
    {
      id: "business",
      header: "Business",
      cell: (r) =>
        r.businessId ? (
          <Link href={`/businesses/${r.businessId}`} className="hover:underline">
            {r.businessName ?? "—"}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "phase",
      header: "Phase",
      cell: (r) =>
        r.phaseType ? PHASE_LABELS[r.phaseType] : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "size",
      header: "Size",
      cell: (r) => <span className="text-muted-foreground">{humanFileSize(r.sizeBytes)}</span>,
    },
    {
      id: "actions",
      header: "",
      headerClassName: "w-28",
      className: "w-28 text-right",
      cell: (r) => <ResourceRowActions resource={r} canWrite={canWrite} />,
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
            placeholder="Search resources…"
            className="pl-8"
          />
        </div>
        <Select value={business} onValueChange={setBusiness}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Business" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All businesses</SelectItem>
            {businesses.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as "ALL" | ResourceType)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {RESOURCE_TYPE_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(r) => r.id}
        empty="No resources match your filters."
      />
    </div>
  );
}
