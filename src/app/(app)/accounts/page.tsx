import type { Metadata } from "next";

import { NotAuthorized } from "@/components/layout/not-authorized";
import { PageHeader } from "@/components/common/page-header";
import { AccountsDashboard } from "@/features/accounts/components/accounts-dashboard";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  if (!(await currentMemberCan("accounts:read"))) {
    return (
      <NotAuthorized
        title="Accounts"
        description="You don't have permission to view accounts."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Track earnings, expenses, and outstanding client balances."
        breadcrumbs={[{ label: "Accounts" }]}
      />
      <AccountsDashboard />
    </>
  );
}
