import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { ProfileView } from "@/features/profile/components/profile-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        description="Your account details."
        breadcrumbs={[{ label: "Profile" }]}
      />
      <ProfileView />
    </>
  );
}
