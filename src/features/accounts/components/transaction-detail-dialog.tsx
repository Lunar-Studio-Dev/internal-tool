"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TRANSACTION_TYPE_LABELS } from "@/features/accounts/constants";
import type { TransactionListItemDto } from "@/features/accounts/api";
import { formatINR } from "@/features/phases/constants";
import { TransactionType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionListItemDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!transaction) return null;

  const isIncome = transaction.type === TransactionType.EARNING;
  const label =
    transaction.category ??
    (transaction.expenseCategory ? transaction.expenseCategory.replace(/_/g, " ") : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction detail</DialogTitle>
          <DialogDescription>{format(new Date(transaction.date), "d MMM yyyy")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={isIncome ? "secondary" : "outline"}>
              {TRANSACTION_TYPE_LABELS[transaction.type]}
            </Badge>
            <span
              className={cn(
                "text-lg font-semibold tabular-nums",
                isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              )}
            >
              {isIncome ? "+" : "−"}
              {formatINR(transaction.amount)}
            </span>
          </div>

          <dl className="grid gap-2">
            {label ? (
              <Row label="Category" value={label} />
            ) : null}
            {transaction.description ? (
              <Row label="Description" value={transaction.description} />
            ) : null}
            {transaction.businessName ? (
              <Row label="Business" value={transaction.businessName} />
            ) : null}
            {transaction.pipelineCode ? (
              <Row label="Pipeline" value={transaction.pipelineCode} />
            ) : null}
            {transaction.reference ? (
              <Row label="Reference" value={transaction.reference} />
            ) : null}
            {transaction.createdByName ? (
              <Row label="Recorded by" value={transaction.createdByName} />
            ) : null}
            <Row
              label="Source"
              value={transaction.fromPayment ? "Recorded from pipeline payment" : "Added manually"}
            />
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[7rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
