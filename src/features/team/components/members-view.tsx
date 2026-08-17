"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
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
import { MemberFormDialog } from "@/features/team/components/member-form-dialog";
import { MemberRowActions } from "@/features/team/components/member-row-actions";
import { ROLE_LABELS, ROLE_ORDER } from "@/features/team/constants";
import { MemberStatus, type RoleName } from "@/generated/prisma/enums";

export type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  roleNames: RoleName[];
};

export function MembersView({ members }: { members: TeamMemberRow[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | RoleName>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MemberStatus>("ALL");

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-8"
          />
        </div>
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
        <MemberFormDialog
          mode="create"
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Add Member
            </Button>
          }
        />
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(m) => m.id}
        empty="No members match your filters."
      />
    </div>
  );
}
