"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  countActiveFilters,
  FilterSheetSection,
  ListFilterBar,
  useFilterSheetDraft,
} from "@/components/common/list-filter-bar";
import { QueryGate } from "@/components/common/query-gate";
import { TablePageSkeleton } from "@/components/common/skeletons";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teamQueries } from "@/features/team/api";
import { MemberFormDialog } from "@/features/team/components/member-form-dialog";
import { MemberRowActions } from "@/features/team/components/member-row-actions";
import { ROLE_LABELS, ROLE_ORDER } from "@/features/team/constants";
import { MemberStatus, type RoleName } from "@/generated/prisma/enums";

type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  roleNames: RoleName[];
};

const FILTER_DEFAULTS = {
  roleFilter: "ALL" as "ALL" | RoleName,
  statusFilter: "ALL" as "ALL" | MemberStatus,
};

export function MembersView() {
  const query = useQuery(teamQueries.list());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | RoleName>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MemberStatus>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const { draft, setDraft } = useFilterSheetDraft(
    { roleFilter, statusFilter },
    filterOpen,
  );
  const activeFilterCount = countActiveFilters(
    { roleFilter, statusFilter },
    FILTER_DEFAULTS,
  );

  const members: TeamMemberRow[] = useMemo(
    () =>
      (query.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone ?? "",
        status: m.status,
        roleNames: m.roles,
      })),
    [query.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !`${m.name} ${m.email}`.toLowerCase().includes(q)) return false;
      if (roleFilter !== "ALL" && !m.roleNames.includes(roleFilter)) return false;
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, search, roleFilter, statusFilter]);

  const columns: DataTableColumn<TeamMemberRow>[] = [
    {
      id: "name",
      header: "Name",
      cell: (m) => (
        <Link href={`/team/${m.id}`} className="font-medium hover:underline">
          {m.name}
        </Link>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (m) => <span className="text-muted-foreground">{m.email}</span>,
    },
    {
      id: "roles",
      header: "Roles",
      cell: (m) =>
        m.roleNames.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {m.roleNames.map((r) => (
              <Badge key={r} variant="secondary" className="font-normal">
                {ROLE_LABELS[r]}
              </Badge>
            ))}
          </div>
        ),
    },
    { id: "status", header: "Status", cell: (m) => <StatusBadge kind={m.status} /> },
    {
      id: "actions",
      header: "",
      headerClassName: "w-10",
      className: "w-10 text-right",
      cell: (m) => <MemberRowActions id={m.id} status={m.status} />,
    },
  ];

  return (
    <QueryGate
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      skeleton={<TablePageSkeleton columns={5} />}
    >
    <div className="flex flex-col gap-4">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or email…"
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onApplyFilters={() => {
          setRoleFilter(draft.roleFilter);
          setStatusFilter(draft.statusFilter);
        }}
        onResetFilters={() => setDraft(FILTER_DEFAULTS)}
        filterSheetContent={
          <>
            <FilterSheetSection label="Role">
              <Select
                value={draft.roleFilter}
                onValueChange={(v) =>
                  setDraft((prev) => ({ ...prev, roleFilter: v as "ALL" | RoleName }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  {ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSheetSection>
            <FilterSheetSection label="Status">
              <Select
                value={draft.statusFilter}
                onValueChange={(v) =>
                  setDraft((prev) => ({ ...prev, statusFilter: v as "ALL" | MemberStatus }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value={MemberStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={MemberStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FilterSheetSection>
          </>
        }
        desktopFilters={
          <>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as "ALL" | RoleName)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                {ROLE_ORDER.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "ALL" | MemberStatus)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value={MemberStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={MemberStatus.INACTIVE}>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <MemberFormDialog
            mode="create"
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                Add Member
              </Button>
            }
          />
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(m) => m.id}
        empty="No members match your filters."
      />
    </div>
    </QueryGate>
  );
}
