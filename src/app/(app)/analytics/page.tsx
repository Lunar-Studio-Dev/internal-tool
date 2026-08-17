import type { Metadata } from "next";
import { ChartColumnIcon, ShieldIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  if (!(await currentMemberCan("analytics:read"))) {
    return (
      <>
        <PageHeader title="Analytics" breadcrumbs={[{ label: "Analytics" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view analytics."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Pipeline health, conversion, and team performance."
        breadcrumbs={[{ label: "Analytics" }]}
      />
      <ComingSoon
        icon={ChartColumnIcon}
        title="Analytics are on the way"
        description="Understand pipeline health, conversion, and team performance at a glance — with the trends that actually drive decisions."
        features={[
          "Conversion funnels across pipeline stages",
          "Revenue and earnings trends over time",
          "Team workload and throughput",
          "Stale-pipeline and bottleneck indicators",
        ]}
      />
    </>
  );
}
