import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { SettingsView } from "@/features/settings/components/settings-view";
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
        description="Workspace preferences and configuration."
        breadcrumbs={[{ label: "Settings" }]}
      />
      <SettingsView />
    </>
  );
}
