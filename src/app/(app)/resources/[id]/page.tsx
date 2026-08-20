import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { ResourceFullscreenView } from "@/features/resources/components/resource-fullscreen-view";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resource" };

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await currentMemberCan("resource:read"))) {
    return (
      <NotAuthorized
        title="Resources"
        description="You don't have permission to view resources."
        breadcrumbs={[{ label: "Resources", href: "/resources" }, { label: "Detail" }]}
      />
    );
  }

  return <ResourceFullscreenView id={id} />;
}
