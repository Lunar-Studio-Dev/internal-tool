import { notFound } from "next/navigation";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { MemberDetailView } from "@/features/team/components/member-detail";
import { getMemberById } from "@/features/team/server/team.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await currentMemberCan("team:manage"))) {
    return (
      <>
        <PageHeader title="Team" breadcrumbs={[{ label: "Team", href: "/team" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You need the Admin role to view team members."
        />
      </>
    );
  }

  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  return <MemberDetailView member={member} />;
}
