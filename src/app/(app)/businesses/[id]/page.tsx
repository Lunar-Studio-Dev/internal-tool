import { notFound } from "next/navigation";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { BusinessDetail } from "@/features/businesses/components/business-detail";
import {
  getBusinessActivity,
  getBusinessById,
} from "@/features/businesses/server/businesses.queries";
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
      <>
        <PageHeader
          title="Business"
          breadcrumbs={[{ label: "Businesses", href: "/businesses" }, { label: "Detail" }]}
        />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view this business."
        />
      </>
    );
  }

  const business = await getBusinessById(id);
  if (!business) notFound();

  const [activity, canCreatePipeline] = await Promise.all([
    getBusinessActivity(id),
    currentMemberCan("pipeline:write"),
  ]);

  return (
    <BusinessDetail
      business={business}
      activity={activity}
      canCreatePipeline={canCreatePipeline}
    />
  );
}
