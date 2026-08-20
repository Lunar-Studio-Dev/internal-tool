import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { BusinessTable } from "@/features/businesses/components/business-table";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Businesses" };

export default async function BusinessesPage() {
  if (!(await currentMemberCan("business:read"))) {
    return (
      <NotAuthorized
        title="Businesses"
        description="You don't have permission to view businesses."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Your client directory — companies, contacts, and relationship history."
        breadcrumbs={[{ label: "Businesses" }]}
      />
      <BusinessTable />
    </>
  );
}
