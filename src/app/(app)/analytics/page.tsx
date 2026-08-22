import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { AnalyticsView } from "@/features/analytics/components/analytics-view";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  if (!(await currentMemberCan("analytics:read"))) {
    return (
      <NotAuthorized
        title="Analytics"
        description="You don't have permission to view analytics."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Pipeline health, conversion, and team performance."
        breadcrumbs={[{ label: "Analytics" }]}
      />
      <AnalyticsView />
    </>
  );
}
