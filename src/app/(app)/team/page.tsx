import type { Metadata } from "next";
import Link from "next/link";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { MembersView, type TeamMemberRow } from "@/features/team/components/members-view";
import { listMembers } from "@/features/team/server/team.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  if (!(await currentMemberCan("team:manage"))) {
    return (
      <>
        <PageHeader title="Team" breadcrumbs={[{ label: "Team" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You need the Admin role to manage team members."
        />
      </>
    );
  }

  const members = await listMembers();
  const rows: TeamMemberRow[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone ?? "",
    status: m.status,
    roleNames: m.roles,
  }));

  return (
    <>
      <PageHeader
        title="Team Members"
        description="Manage members and the roles that define their access."
        breadcrumbs={[{ label: "Team" }]}
        action={
          <Button variant="outline" asChild>
            <Link href="/team/roles">Roles &amp; permissions</Link>
          </Button>
        }
      />
      <MembersView members={rows} />
    </>
  );
}
