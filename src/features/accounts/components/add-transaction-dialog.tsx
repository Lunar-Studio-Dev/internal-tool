"use client";

import { format } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";

import { FieldError, FieldLabel, FormErrorAlert } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
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
import { accountQueries, useAddTransaction } from "@/features/accounts/api";
import {
  EARNING_CATEGORY_OPTIONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_OPTIONS,
} from "@/features/accounts/constants";
import { addTransactionSchema } from "@/features/accounts/schemas/transaction.schema";
import { BusinessCombobox } from "@/features/pipelines/components/business-combobox";
import { formatINR, rupeesToPaise } from "@/features/phases/constants";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";
import { TransactionType } from "@/generated/prisma/enums";
import { useQuery } from "@tanstack/react-query";

export function AddTransactionDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(TransactionType.EARNING);
  const [amountRupees, setAmountRupees] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<string>(EARNING_CATEGORY_OPTIONS[0]);
  const [expenseCategory, setExpenseCategory] = useState<string>(EXPENSE_CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [pipelineId, setPipelineId] = useState<string>("");
  const [quotationId, setQuotationId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const optionsQuery = useQuery({
    ...accountQueries.options(),
    enabled: open,
  });
  const addTransaction = useAddTransaction();

  const pipelineOptions = useMemo(() => {
    const all = optionsQuery.data?.pipelines ?? [];
    if (!businessId) return all;
    return all.filter((p) => p.businessId === businessId);
  }, [optionsQuery.data?.pipelines, businessId]);

  const quotationOptions = useMemo(() => {
    const all = optionsQuery.data?.quotations ?? [];
    if (!pipelineId) return [];
    return all.filter((q) => q.pipelineId === pipelineId);
  }, [optionsQuery.data?.quotations, pipelineId]);

  function resetForm() {
    setType(TransactionType.EARNING);
    setAmountRupees("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCategory(EARNING_CATEGORY_OPTIONS[0]);
    setExpenseCategory(EXPENSE_CATEGORY_OPTIONS[0]);
    setDescription("");
    setReference("");
    setBusinessId(null);
    setPipelineId("");
    setQuotationId("");
    setError(null);
    setErrors({});
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      type,
      amountPaise: rupeesToPaise(Number(amountRupees)),
      date: new Date(date).toISOString(),
      category: type === TransactionType.EARNING ? category : undefined,
      expenseCategory: type === TransactionType.EXPENSE ? expenseCategory : undefined,
      description,
      reference,
      businessId: businessId ?? "",
      pipelineId,
      quotationId,
    };

    const parsed = parseForm(addTransactionSchema, payload);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    try {
      await addTransaction.mutateAsync(parsed.data);
      toast.success(type === TransactionType.EARNING ? "Income recorded" : "Expense recorded");
      handleOpenChange(false);
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon className="size-4" />
            Add transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={(e) => void onSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Add financial transaction</DialogTitle>
            <DialogDescription>
              Record income linked to a deal, or log an internal expense.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {error ? <FormErrorAlert message={error} /> : null}

            <div className="flex flex-col gap-2">
              <FieldLabel>Type</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === TransactionType.EARNING ? "default" : "outline"}
                  onClick={() => setType(TransactionType.EARNING)}
                >
                  Income
                </Button>
                <Button
                  type="button"
                  variant={type === TransactionType.EXPENSE ? "default" : "outline"}
                  onClick={() => setType(TransactionType.EXPENSE)}
                >
                  Expense
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="txnAmount">Amount (₹)</FieldLabel>
                <Input
                  id="txnAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  required
                />
                <FieldError error={errors.amountPaise} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="txnDate">Date</FieldLabel>
                <Input
                  id="txnDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <FieldError error={errors.date} />
              </div>
            </div>

            {type === TransactionType.EARNING ? (
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="earningCategory">Category</FieldLabel>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="earningCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EARNING_CATEGORY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={errors.category} />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="expenseCategory">Category</FieldLabel>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger id="expenseCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {EXPENSE_CATEGORY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={errors.expenseCategory} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="txnDescription">Description</FieldLabel>
              <Textarea
                id="txnDescription"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="What was this for?"
              />
              <FieldError error={errors.description} />
            </div>

            {type === TransactionType.EARNING ? (
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Link to deal (optional)</p>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Business</FieldLabel>
                  <BusinessCombobox
                    options={optionsQuery.data?.businesses ?? []}
                    value={businessId}
                    onChange={(id) => {
                      setBusinessId(id);
                      setPipelineId("");
                      setQuotationId("");
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="txnPipeline">Pipeline</FieldLabel>
                  <Select
                    value={pipelineId || "__none__"}
                    onValueChange={(v) => {
                      const next = v === "__none__" ? "" : v;
                      setPipelineId(next);
                      setQuotationId("");
                      if (next) {
                        const pipeline = pipelineOptions.find((p) => p.id === next);
                        if (pipeline) setBusinessId(pipeline.businessId);
                      }
                    }}
                  >
                    <SelectTrigger id="txnPipeline">
                      <SelectValue placeholder="Select pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {pipelineOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} · {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="txnQuotation">Quotation</FieldLabel>
                  <Select
                    value={quotationId || "__none__"}
                    onValueChange={(v) => setQuotationId(v === "__none__" ? "" : v)}
                    disabled={!pipelineId}
                  >
                    <SelectTrigger id="txnQuotation">
                      <SelectValue placeholder="Select quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {quotationOptions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          V{q.version} · {formatINR(q.subtotal)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="txnReference">Reference</FieldLabel>
              <Input
                id="txnReference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={200}
                placeholder="Invoice / UTR / receipt no."
              />
              <FieldError error={errors.reference} />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addTransaction.isPending}>
              {addTransaction.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Save transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
