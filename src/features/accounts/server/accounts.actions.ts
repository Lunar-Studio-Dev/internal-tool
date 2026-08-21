import "server-only";

import { EXPENSE_CATEGORY_LABELS } from "@/features/accounts/constants";
import { addTransactionSchema } from "@/features/accounts/schemas/transaction.schema";
import { TransactionType } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { friendlyDbError } from "@/lib/db-errors";
import { emptyToNull } from "@/lib/utils";

export type AddTransactionResult = { ok: true; id: string } | { ok: false; error: string };

export async function addTransactionAction(input: unknown): Promise<AddTransactionResult> {
  const member = await requirePermission("accounts:write");
  const parsed = addTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const paidAt = new Date(d.date);
  if (Number.isNaN(paidAt.getTime())) {
    return { ok: false, error: "Pick a valid date." };
  }

  const businessId = emptyToNull(d.businessId);
  const pipelineId = emptyToNull(d.pipelineId);
  const quotationId = emptyToNull(d.quotationId);

  let resolvedBusinessId = businessId;

  if (pipelineId) {
    const pipeline = await db.pipeline.findUnique({
      where: { id: pipelineId },
      select: { businessId: true },
    });
    if (!pipeline) return { ok: false, error: "Pipeline not found." };
    if (resolvedBusinessId && resolvedBusinessId !== pipeline.businessId) {
      return { ok: false, error: "Pipeline does not belong to the selected business." };
    }
    resolvedBusinessId = resolvedBusinessId ?? pipeline.businessId;
  }

  if (quotationId && pipelineId) {
    const quotation = await db.quotation.findFirst({
      where: { id: quotationId, pipelineId },
    });
    if (!quotation) {
      return { ok: false, error: "Quotation not found for this pipeline." };
    }
  }

  try {
    const category =
      d.type === TransactionType.EXPENSE && d.expenseCategory
        ? EXPENSE_CATEGORY_LABELS[d.expenseCategory]
        : emptyToNull(d.category);

    const txn = await db.transaction.create({
      data: {
        type: d.type,
        amount: d.amountPaise,
        date: paidAt,
        category,
        expenseCategory:
          d.type === TransactionType.EXPENSE ? (d.expenseCategory ?? null) : null,
        description: emptyToNull(d.description),
        reference: emptyToNull(d.reference),
        businessId: resolvedBusinessId,
        pipelineId,
        quotationId,
        createdById: member.id,
      },
    });

    await logActivity({
      actorId: member.id,
      action: "transaction.created",
      entityType: "Transaction",
      entityId: txn.id,
      businessId: businessId ?? undefined,
      pipelineId: pipelineId ?? undefined,
      metadata: {
        type: d.type,
        amount: d.amountPaise,
        category,
        expenseCategory: d.expenseCategory ?? null,
      },
    });

    return { ok: true, id: txn.id };
  } catch (error) {
    return {
      ok: false,
      error: friendlyDbError(error, "Could not save transaction."),
    };
  }
}
