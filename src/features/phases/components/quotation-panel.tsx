"use client";

import { type FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuotation, type QuotationDto } from "@/features/phases/api";
import { formatINR, paiseToRupees, rupeesToPaise } from "@/features/phases/constants";
import { createQuotationSchema, quotationLineItemSchema } from "@/features/phases/schemas/phase.schema";
import { mutationErrorMessage } from "@/lib/api/errors";
import { parseForm, type FieldErrors } from "@/lib/form";

type LineItem = { item: string; qty: number; ratePaise: number; amountPaise: number };

function CreateQuotationDialog({
  pipelineId,
  canWrite,
}: {
  pipelineId: string;
  canWrite: boolean;
}) {
  const create = useCreateQuotation(pipelineId);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [items, setItems] = useState<LineItem[]>([{ item: "", qty: 1, ratePaise: 0, amountPaise: 0 }]);

  const subtotalPaise = useMemo(
    () => items.reduce((sum, row) => sum + row.amountPaise, 0),
    [items],
  );

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        next.amountPaise = Math.round(next.qty * next.ratePaise);
        return next;
      }),
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const parsed = parseForm(createQuotationSchema.omit({ pipelineId: true }), {
      title: String(data.get("title") ?? ""),
      scope: String(data.get("scope") ?? ""),
      items,
      subtotalPaise,
      initialPaymentPaise: rupeesToPaise(Number(data.get("initialPaymentRupees") ?? 0)),
      paymentTerms: String(data.get("paymentTerms") ?? ""),
      validUntil: String(data.get("validUntil") ?? ""),
      publish: true,
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    for (const row of parsed.data.items) {
      const line = quotationLineItemSchema.safeParse(row);
      if (!line.success) {
        toast.error(line.error.issues[0]?.message ?? "Invalid line item");
        return;
      }
    }
    setErrors({});
    try {
      await create.mutateAsync(parsed.data);
      toast.success("Quotation version created");
      setOpen(false);
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="size-4" />
          New version
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create quotation</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="title" required>
              Title
            </FieldLabel>
            <Input id="title" name="title" maxLength={200} />
            <FieldError error={errors.title} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="scope">
              Scope
            </FieldLabel>
            <Textarea id="scope" name="scope" rows={3} maxLength={5000} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel required>Line items</FieldLabel>
            {items.map((row, index) => (
              <div key={index} className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Item"
                  value={row.item}
                  onChange={(e) => updateItem(index, { item: e.target.value })}
                  className="col-span-2"
                />
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Qty"
                  value={row.qty || ""}
                  onChange={(e) => updateItem(index, { qty: Number(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Rate ₹"
                  value={row.ratePaise ? paiseToRupees(row.ratePaise) : ""}
                  onChange={(e) =>
                    updateItem(index, { ratePaise: rupeesToPaise(Number(e.target.value) || 0) })
                  }
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setItems([...items, { item: "", qty: 1, ratePaise: 0, amountPaise: 0 }])}>
              Add line
            </Button>
            <p className="text-sm text-muted-foreground">Subtotal: {formatINR(subtotalPaise)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="initialPaymentRupees">
                Initial payment (₹)
              </FieldLabel>
              <Input id="initialPaymentRupees" name="initialPaymentRupees" type="number" min={0} step={0.01} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="validUntil">
                Valid until
              </FieldLabel>
              <Input id="validUntil" name="validUntil" type="date" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="paymentTerms">
              Payment terms
            </FieldLabel>
            <Textarea id="paymentTerms" name="paymentTerms" rows={2} maxLength={2000} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
              Save & publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuotationRow({ q }: { q: QuotationDto }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <div>
        <span className="font-medium">V{q.version}</span>
        {q.title ? <span className="text-muted-foreground"> · {q.title}</span> : null}
        <p className="text-xs text-muted-foreground">
          {formatINR(q.subtotal)}
          {q.validUntil ? ` · Valid ${format(new Date(q.validUntil), "d MMM yyyy")}` : null}
        </p>
      </div>
      <Badge variant={q.status === "CURRENT" ? "default" : "secondary"}>{q.status}</Badge>
    </div>
  );
}

export function QuotationPanel({
  pipelineId,
  quotations,
  canWrite,
}: {
  pipelineId: string;
  quotations: QuotationDto[];
  canWrite: boolean;
}) {
  const current = quotations.find((q) => q.status === "CURRENT");

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Quotation</p>
        <CreateQuotationDialog pipelineId={pipelineId} canWrite={canWrite} />
      </div>
      {current ? (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">
            Version V{current.version} · {formatINR(current.subtotal)}
          </p>
          <p className="text-muted-foreground">
            Initial payment: {formatINR(current.initialPayment)}
            {current.paymentTerms ? ` · ${current.paymentTerms}` : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No current quotation yet.</p>
      )}
      {quotations.length > 0 ? (
        <div className="flex flex-col divide-y">
          <p className="pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">History</p>
          {quotations.map((q) => (
            <QuotationRow key={q.id} q={q} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
