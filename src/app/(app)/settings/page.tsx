import type { Metadata } from "next";
import { SettingsIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (!(await currentMemberCan("settings:manage"))) {
    return (
      <NotAuthorized
        title="Settings"
        description="You need the Admin role to manage settings."
      />
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
