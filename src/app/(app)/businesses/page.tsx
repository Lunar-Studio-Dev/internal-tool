import type { Metadata } from "next";
import { ShieldIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { BusinessTable, type BusinessRow } from "@/features/businesses/components/business-table";
import { listBusinesses } from "@/features/businesses/server/businesses.queries";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Businesses" };

export default async function BusinessesPage() {
  if (!(await currentMemberCan("business:read"))) {
    return (
      <>
        <PageHeader title="Businesses" breadcrumbs={[{ label: "Businesses" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view businesses."
        />
      </>
    );
  }

  const businesses = await listBusinesses();
  const rows: BusinessRow[] = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    website: b.website ?? "",
    industry: b.industry ?? "",
    primaryContact: b.contacts[0]?.name ?? "",
    // Pipeline counts are wired in PHASE_5.
    pipelineCount: 0,
    activePipelineCount: 0,
  }));

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Your client directory — companies, contacts, and relationship history."
        breadcrumbs={[{ label: "Businesses" }]}
      />
      <BusinessTable businesses={rows} />
    </>
  );
}
