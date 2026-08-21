"use client";

import { format } from "date-fns";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { QuerySection } from "@/components/common/query-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  accountQueries,
  type TransactionListItemDto,
} from "@/features/accounts/api";
import { TRANSACTION_TYPE_LABELS } from "@/features/accounts/constants";
import { TransactionDetailDialog } from "@/features/accounts/components/transaction-detail-dialog";
import { formatINR } from "@/features/phases/constants";
import { TransactionType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function RecentTransactions({
  onViewAll,
}: {
  onViewAll?: () => void;
}) {
  const query = useQuery(accountQueries.recentTransactions());
  const [selected, setSelected] = useState<TransactionListItemDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Recent transactions</CardTitle>
          {onViewAll ? (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View all
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col divide-y p-0">
          <QuerySection
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            skeleton={<Skeleton className="m-4 h-24" />}
          >
            {(query.data ?? []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              (query.data ?? []).map((row) => (
                <TransactionRow
                  key={row.id}
                  row={row}
                  onSelect={() => {
                    setSelected(row);
                    setDetailOpen(true);
                  }}
                />
              ))
            )}
          </QuerySection>
        </CardContent>
      </Card>

      <TransactionDetailDialog
        transaction={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

function TransactionRow({
  row,
  onSelect,
}: {
  row: TransactionListItemDto;
  onSelect: () => void;
}) {
  const isIncome = row.type === TransactionType.EARNING;

  return (
    <button
      type="button"
      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40"
      onClick={onSelect}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.date), "d MMM yyyy")}
          </span>
          <Badge variant={isIncome ? "secondary" : "outline"}>
            {TRANSACTION_TYPE_LABELS[row.type]}
          </Badge>
        </div>
        <p className="mt-1 font-medium truncate">
          {row.description ?? row.category ?? "—"}
        </p>
        {row.businessName ? (
          <p className="text-xs text-muted-foreground truncate">{row.businessName}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "tabular-nums font-medium",
            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          )}
        >
          {isIncome ? "+" : "−"}
          {formatINR(row.amount)}
        </span>
        <ChevronRightIcon className="size-4 text-muted-foreground" />
      </div>
    </button>
  );
}
