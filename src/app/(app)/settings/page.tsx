import type { Metadata } from "next";
import { SettingsIcon, ShieldIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (!(await currentMemberCan("settings:manage"))) {
    return (
      <>
        <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You need the Admin role to manage settings."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace preferences and integrations."
        breadcrumbs={[{ label: "Settings" }]}
      />
      <ComingSoon
        icon={SettingsIcon}
        title="Settings are on the way"
        description="Configure your workspace, preferences, and integrations from one place."
        features={[
          "Workspace profile and branding",
          "Notification preferences",
          "Third-party integrations",
          "Data export and housekeeping",
        ]}
      />
    </>
  );
}
