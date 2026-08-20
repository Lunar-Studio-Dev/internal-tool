import { NotAuthorized } from "@/components/layout/not-authorized";
import { BusinessDetail } from "@/features/businesses/components/business-detail";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await currentMemberCan("business:read"))) {
    return (
      <NotAuthorized
        title="Business"
        description="You don't have permission to view this business."
        breadcrumbs={[{ label: "Businesses", href: "/businesses" }, { label: "Detail" }]}
      />
    );
  }

  return <BusinessDetail id={id} />;
}
