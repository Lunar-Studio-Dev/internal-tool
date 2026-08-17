import type { Metadata } from "next";
import { Building2Icon, ShieldIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
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

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Your client directory — companies, contacts, and relationship history."
        breadcrumbs={[{ label: "Businesses" }]}
      />
      <ComingSoon
        icon={Building2Icon}
        title="Businesses are on the way"
        description="A central directory of every company you work with — profiles, contacts, and the full relationship history in one place."
        features={[
          "Company profiles with multiple contacts and a primary contact",
          "Duplicate detection before you create a new business",
          "Linked pipelines, meetings, and an activity timeline",
          "Fast search and filtering across your whole client base",
        ]}
      />
    </>
  );
}
