"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QuotationDto } from "@/features/phases/api";
import { formatINR } from "@/features/phases/constants";
import {
  parseQuotationItems,
  QUOTATION_STATUS_LABELS,
} from "@/features/phases/quotation-metrics";

export function QuotationDetailDialog({
  quotation,
  open,
  onOpenChange,
}: {
  quotation: QuotationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!quotation) return null;

  const items = parseQuotationItems(quotation.items);
  const statusLabel =
    QUOTATION_STATUS_LABELS[quotation.status as keyof typeof QUOTATION_STATUS_LABELS] ??
    quotation.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span>Quotation V{quotation.version}</span>
            <Badge variant={quotation.status === "CURRENT" ? "default" : "secondary"}>
              {statusLabel}
            </Badge>
          </DialogTitle>
          {quotation.title ? (
            <p className="text-sm text-muted-foreground">{quotation.title}</p>
          ) : null}
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {quotation.scope ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Scope
              </h3>
              <p className="whitespace-pre-wrap text-sm">{quotation.scope}</p>
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Line items
            </h3>
            {items.length ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-16 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Rate</TableHead>
                      <TableHead className="w-28 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row, index) => (
                      <TableRow key={`${row.item}-${index}`}>
                        <TableCell className="font-medium">{row.item}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.qty}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(row.ratePaise)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(row.amountPaise)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items recorded.</p>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="text-sm font-semibold">{formatINR(quotation.subtotal)}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Initial payment</p>
              <p className="text-sm font-semibold">{formatINR(quotation.initialPayment)}</p>
            </div>
            {quotation.validUntil ? (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Valid until</p>
                <p className="text-sm font-semibold">
                  {format(new Date(quotation.validUntil), "d MMM yyyy")}
                </p>
              </div>
            ) : null}
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-semibold">
                {format(new Date(quotation.createdAt), "d MMM yyyy")}
              </p>
            </div>
          </section>

          {quotation.paymentTerms ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Payment terms
              </h3>
              <p className="whitespace-pre-wrap text-sm">{quotation.paymentTerms}</p>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
