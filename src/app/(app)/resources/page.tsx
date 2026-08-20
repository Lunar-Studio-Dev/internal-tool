import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { ResourcesView } from "@/features/resources/components/resources-view";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  if (!(await currentMemberCan("resource:read"))) {
    return (
      <NotAuthorized
        title="Resources"
        description="You don't have permission to view resources."
      />
    );
  }

  return <ResourcesView />;
}
