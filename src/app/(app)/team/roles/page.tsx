import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { RolesMatrix } from "@/features/team/components/roles-matrix";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  if (!(await currentMemberCan("team:manage"))) {
    return (
      <NotAuthorized
        title="Roles & permissions"
        description="You need the Admin role to view this reference."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="Read-only reference of what each role can do."
        breadcrumbs={[{ label: "Team", href: "/team" }, { label: "Roles" }]}
      />
      <RolesMatrix />
    </>
  );
}
