"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EyeIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  countActiveFilters,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
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
import { BusinessCombobox } from "@/components/common/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_ORDER, humanFileSize } from "@/features/resources/constants";
import { useDeleteResource } from "@/features/resources/api";
import { ResourcePreviewDialog } from "@/features/resources/components/resource-preview-dialog";
import { PHASE_LABELS } from "@/features/pipelines/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import type { PhaseType, ResourceType } from "@/generated/prisma/enums";

export type ResourceRow = {
  id: string;
  name: string;
  type: ResourceType;
  contentType?: string | null;
  sizeBytes: number | null;
  businessId: string | null;
  businessName: string | null;
  pipelineId: string | null;
  pipelineCode: string | null;
  phaseType: PhaseType | null;
};

const FILTER_DEFAULTS = { business: "ALL" as "ALL" | string, type: "ALL" as "ALL" | ResourceType };

function ResourceRowActions({
  resource,
  canWrite,
  onOpen,
}: {
  resource: ResourceRow;
  canWrite: boolean;
  onOpen: () => void;
}) {
  const deleteResource = useDeleteResource();

  async function remove() {
    try {
      await deleteResource.mutateAsync(resource.id);
      toast.success("Resource deleted");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={onOpen}>
        <EyeIcon className="size-4" />
        Open
      </Button>
      {canWrite ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${resource.name}`}
              disabled={deleteResource.isPending}
            >
              {deleteResource.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
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
  const [preview, setPreview] = useState<ResourceRow | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft({ business, type }, filterOpen);
  const activeFilterCount = countActiveFilters({ business, type }, FILTER_DEFAULTS);

  const businesses = useMemo(
    () =>
      [...new Map(
        resources
          .filter((r) => r.businessId)
          .map((r) => [r.businessId as string, r.businessName ?? r.businessId] as const),
      )].map(([id, name]) => ({ id, name: name ?? id })),
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
      headerClassName: "w-32",
      className: "w-32 text-right",
      cell: (r) => (
        <ResourceRowActions resource={r} canWrite={canWrite} onOpen={() => setPreview(r)} />
      ),
    },
  ];

  const businessFilter = (
    <BusinessCombobox
      options={businesses}
      value={business}
      onChange={setBusiness}
      placeholder="Business"
      allowAll
      allLabel="All businesses"
      allValue="ALL"
      className="w-48"
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search resources…"
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onApplyFilters={() => {
          setBusiness(draft.business);
          setType(draft.type);
        }}
        onResetFilters={() => setDraft(FILTER_DEFAULTS)}
        filterSheetContent={
          <>
            <FilterSheetSection label="Business">
              <BusinessCombobox
                options={businesses}
                value={draft.business}
                onChange={(value) => setDraft((prev) => ({ ...prev, business: value }))}
                placeholder="Business"
                allowAll
                allLabel="All businesses"
                allValue="ALL"
              />
            </FilterSheetSection>
            <FilterSheetSection label="Type">
              <Select
                value={draft.type}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, type: value as "ALL" | ResourceType }))
                }
              >
                <SelectTrigger className="w-full">
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
            </FilterSheetSection>
          </>
        }
        desktopFilters={
          <>
            {businessFilter}
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
          </>
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(r) => r.id}
        empty="No resources match your filters."
      />
      <ResourcePreviewDialog
        resource={preview}
        open={preview !== null}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
      />
    </div>
  );
}
