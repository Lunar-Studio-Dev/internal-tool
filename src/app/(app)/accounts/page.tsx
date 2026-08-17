import type { Metadata } from "next";
import { ShieldIcon, WalletIcon } from "lucide-react";

import { ComingSoon } from "@/components/common/coming-soon";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { currentMemberCan } from "@/lib/auth/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  if (!(await currentMemberCan("accounts:read"))) {
    return (
      <>
        <PageHeader title="Accounts" breadcrumbs={[{ label: "Accounts" }]} />
        <EmptyState
          icon={ShieldIcon}
          title="Not authorized"
          description="You don't have permission to view accounts."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Earnings, payments, and financial records per client."
        breadcrumbs={[{ label: "Accounts" }]}
      />
      <ComingSoon
        icon={WalletIcon}
        title="Accounts are on the way"
        description="Keep earnings, payments, and financial records tied to each client and pipeline, so the numbers are always current."
        features={[
          "Record earnings and payments per business",
          "Payment follow-ups until invoices clear",
          "Link records to quotations and pipelines",
          "Financial summaries at a glance",
        ]}
      />
    </>
  );
}
