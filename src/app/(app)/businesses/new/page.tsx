import type { Metadata } from "next";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { BusinessForm } from "@/features/businesses/components/business-form";
import { currentMemberCan, getCurrentMember } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Business" };

export default async function NewBusinessPage() {
  if (!(await currentMemberCan("business:write"))) {
    return (
      <>
        <PageHeader
          title="New Business"
          breadcrumbs={[{ label: "Businesses", href: "/businesses" }, { label: "New" }]}
        />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to create businesses."
        />
      </>
    );
  }

  const member = await getCurrentMember();

  return (
    <>
      <PageHeader
        title="New Business"
        description="Create a permanent client record. We'll check for possible duplicates on save."
        breadcrumbs={[{ label: "Businesses", href: "/businesses" }, { label: "New" }]}
      />
      <div className="max-w-3xl">
        <BusinessForm mode="create" canForce={member?.isAdmin ?? false} />
      </div>
    </>
  );
}
