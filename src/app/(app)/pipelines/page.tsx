import type { Metadata } from "next";
import { ShieldIcon, WorkflowIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pipelines" };

export default async function PipelinesPage() {
  if (!(await currentMemberCan("pipeline:read"))) {
    return (
      <>
        <PageHeader title="Pipelines" breadcrumbs={[{ label: "Pipelines" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view pipelines."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pipelines"
        description="Opportunities moving from Discovery through to Project."
        breadcrumbs={[{ label: "Pipelines" }]}
      />
      <ComingSoon
        icon={WorkflowIcon}
        title="Pipelines are on the way"
        description="Track every opportunity as it moves through Discovery → Business → Requirement → Quotation → Project."
        features={[
          "A visual stepper that shows exactly where each deal stands",
          "Promote, deactivate, and reactivate stages with a reason trail",
          "Quotation versioning and full negotiation history",
          "Follow-up scheduling so no opportunity goes cold",
        ]}
      />
    </>
  );
}
