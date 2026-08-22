import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        title="Activity"
        description="System-wide timeline of changes across the workspace."
        breadcrumbs={[{ label: "Activity" }]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline />
        </CardContent>
      </Card>
    </>
  );
}
