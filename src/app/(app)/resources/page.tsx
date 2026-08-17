import type { Metadata } from "next";
import { FolderClosedIcon, ShieldIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  if (!(await currentMemberCan("resource:read"))) {
    return (
      <>
        <PageHeader title="Resources" breadcrumbs={[{ label: "Resources" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view resources."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Resources"
        description="A shared library of documents, links, and assets."
        breadcrumbs={[{ label: "Resources" }]}
      />
      <ComingSoon
        icon={FolderClosedIcon}
        title="Resources are on the way"
        description="A shared library of documents, links, and assets your team can attach anywhere — no more hunting through inboxes and drives."
        features={[
          "Upload files to secure cloud storage",
          "Organize everything into a categorized library",
          "Attach resources to pipelines, projects, and tasks",
          "Share links and keep versions tidy",
        ]}
      />
    </>
  );
}
