"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { FieldLabel } from "@/components/common/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRecordPayment } from "@/features/payments/api";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS } from "@/features/payments/constants";
import { formatINR, rupeesToPaise } from "@/features/phases/constants";
import { mutationErrorMessage } from "@/lib/api/errors";

export function RecordPaymentDialog({
  pipelineId,
  businessName,
  pipelineCode,
  quotationLabel,
  remainingPaise,
  trigger,
}: {
  pipelineId: string;
  businessName: string;
  pipelineCode: string;
  quotationLabel: string;
  remainingPaise: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amountRupees, setAmountRupees] = useState(
    remainingPaise > 0 ? String(remainingPaise / 100) : "",
  );
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState<string>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [createEarning, setCreateEarning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recordPayment = useRecordPayment(pipelineId);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setAmountRupees(remainingPaise > 0 ? String(remainingPaise / 100) : "");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setMethod("BANK_TRANSFER");
      setReference("");
      setNotes("");
      setCreateEarning(true);
      setError(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const amountPaise = rupeesToPaise(Number(amountRupees));
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    try {
      const result = await recordPayment.mutateAsync({
        amountPaise,
        date: new Date(date).toISOString(),
        method,
        reference,
        notes,
        createEarning,
      });
      if (result.promoted) {
        toast.success("Payment recorded — moved to Project Management");
      } else if (result.fullyPaid) {
        toast.success("Payment recorded — contract fully paid");
      } else {
        toast.success("Payment recorded");
      }
      setOpen(false);
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={(e) => void submit(e)}>
          <DialogHeader>
            <DialogTitle>Receive payment from client</DialogTitle>
            <DialogDescription>
              {businessName} · {pipelineCode} · {quotationLabel}
              {remainingPaise > 0 ? ` · Contract remaining ${formatINR(remainingPaise)}` : null}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="paymentAmount">Amount (₹)</FieldLabel>
              <Input
                id="paymentAmount"
                type="number"
                min={0}
                step={0.01}
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="paymentDate">Date</FieldLabel>
                <Input
                  id="paymentDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="paymentMethod">Method</FieldLabel>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {PAYMENT_METHOD_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="paymentReference">Reference</FieldLabel>
              <Input
                id="paymentReference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={200}
                placeholder="UTR / cheque no."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="paymentNotes">Notes</FieldLabel>
              <Textarea
                id="paymentNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="Optional notes about this payment"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={createEarning}
                onCheckedChange={(v) => setCreateEarning(v === true)}
              />
              Create earning record
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Receive payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
