import type { Metadata } from "next";
import Link from "next/link";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { MembersView } from "@/features/team/components/members-view";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  if (!(await currentMemberCan("team:manage"))) {
    return (
      <NotAuthorized
        title="Team"
        description="You need the Admin role to manage team members."
      />
    );
  }

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
      <MembersView />
    </>
  );
}
