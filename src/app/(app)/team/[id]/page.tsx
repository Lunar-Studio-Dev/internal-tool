import { NotAuthorized } from "@/components/layout/not-authorized";
import { MemberDetailView } from "@/features/team/components/member-detail";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await currentMemberCan("team:manage"))) {
    return (
      <NotAuthorized
        title="Team"
        description="You need the Admin role to view team members."
        breadcrumbs={[{ label: "Team", href: "/team" }]}
      />
    );
  }

  const { id } = await params;
  return <MemberDetailView id={id} />;
}
