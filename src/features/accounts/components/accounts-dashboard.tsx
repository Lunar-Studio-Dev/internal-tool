"use client";

import { useState } from "react";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { MetricCard, METRIC_GRID_CLASS } from "@/components/common/metric-card";
import { QueryGate } from "@/components/common/query-gate";
import {
  SectionTabs,
  SectionTabsList,
  SectionTabsTrigger,
} from "@/components/common/section-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { accountQueries } from "@/features/accounts/api";
import { AddTransactionDialog } from "@/features/accounts/components/add-transaction-dialog";
import { EarningsVsExpensesChart } from "@/features/accounts/components/earnings-vs-expenses-chart";
import { OutstandingTable } from "@/features/accounts/components/outstanding-table";
import { RecentTransactions } from "@/features/accounts/components/recent-transactions";
import { RevenueByMonthChart } from "@/features/accounts/components/revenue-by-month-chart";
import { TransactionsTable } from "@/features/accounts/components/transactions-table";
import { formatINR } from "@/features/phases/constants";
import { useCan } from "@/features/team/hooks/use-current-member";
import { TransactionType } from "@/generated/prisma/enums";

export function AccountsDashboard() {
  const [tab, setTab] = useState("overview");
  const canWrite = useCan("accounts:write");
  const summaryQuery = useQuery(accountQueries.summary());

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <AddTransactionDialog />
        </div>
      ) : null}

      <QueryGate
        isPending={summaryQuery.isPending}
        isError={summaryQuery.isError}
        error={summaryQuery.error}
        skeleton={<div className={`${METRIC_GRID_CLASS}`}>{Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}</div>}
      >
        <div className={METRIC_GRID_CLASS}>
          <MetricCard
            icon={ArrowUpCircleIcon}
            label="Total earning"
            value={formatINR(summaryQuery.data?.earningPaise ?? 0)}
            tone="success"
          />
          <MetricCard
            icon={ArrowDownCircleIcon}
            label="Total expense"
            value={formatINR(summaryQuery.data?.expensePaise ?? 0)}
          />
          <MetricCard
            icon={ScaleIcon}
            label="Net profit"
            value={formatINR(summaryQuery.data?.netPaise ?? 0)}
            tone={(summaryQuery.data?.netPaise ?? 0) >= 0 ? "success" : "warning"}
          />
          <MetricCard
            icon={WalletIcon}
            label="Outstanding"
            value={formatINR(summaryQuery.data?.outstandingPaise ?? 0)}
            tone={(summaryQuery.data?.outstandingPaise ?? 0) > 0 ? "warning" : "default"}
            onClick={() => setTab("outstanding")}
          />
        </div>
      </QueryGate>

      <div className="grid gap-4 lg:grid-cols-2">
        <EarningsVsExpensesChart />
        <RevenueByMonthChart />
      </div>

      <SectionTabs value={tab} onValueChange={setTab} className="gap-4">
        <SectionTabsList>
          <SectionTabsTrigger value="overview">Overview</SectionTabsTrigger>
          <SectionTabsTrigger value="earnings">Earnings</SectionTabsTrigger>
          <SectionTabsTrigger value="expenses">Expenses</SectionTabsTrigger>
          <SectionTabsTrigger value="outstanding">Outstanding</SectionTabsTrigger>
          <SectionTabsTrigger value="transactions">Transactions</SectionTabsTrigger>
        </SectionTabsList>

        <TabsContent value="overview">
          <RecentTransactions onViewAll={() => setTab("transactions")} />
        </TabsContent>

        <TabsContent value="earnings">
          <TransactionsTable fixedType={TransactionType.EARNING} />
        </TabsContent>

        <TabsContent value="expenses">
          <TransactionsTable fixedType={TransactionType.EXPENSE} />
        </TabsContent>

        <TabsContent value="outstanding">
          <OutstandingTable />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTable />
        </TabsContent>
      </SectionTabs>
    </div>
  );
}
