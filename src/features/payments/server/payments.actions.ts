import "server-only";

import { recordPaymentSchema } from "@/features/payments/schemas/payment.schema";
import {
  isPipelinePaymentEligible,
  sumPaymentsInTx,
} from "@/features/payments/server/payments.queries";
import { promotePhaseInTx } from "@/features/pipelines/server/state-machine";
import {
  ClientDecision,
  PaymentMethod,
  PhaseType,
  QuotationVersionStatus,
  TransactionType,
} from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type RecordPaymentResult =
  | { ok: true; id: string; promoted: boolean; fullyPaid: boolean }
  | { ok: false; error: string };

export async function recordPaymentAction(input: unknown): Promise<RecordPaymentResult> {
  const member = await requirePermission("payment:write");
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const paidAt = new Date(d.date);
  if (Number.isNaN(paidAt.getTime())) {
    return { ok: false, error: "Pick a valid payment date." };
  }

  try {
    const pipeline = await db.pipeline.findUnique({
      where: { id: d.pipelineId },
      include: { decision: true },
    });
    if (!pipeline) return { ok: false, error: "Pipeline not found." };
    if (!isPipelinePaymentEligible(pipeline)) {
      return {
        ok: false,
        error: "Payments can only be recorded while the pipeline is in Quotation or Project Management.",
      };
    }
    if (pipeline.decision?.decision !== ClientDecision.ACCEPTED) {
      return { ok: false, error: "Accept the quotation before recording payment." };
    }

    const quotation = await db.quotation.findFirst({
      where: { pipelineId: d.pipelineId, status: QuotationVersionStatus.CURRENT },
    });
    if (!quotation) {
      return { ok: false, error: "Publish a quotation before recording payment." };
    }

    const alreadyReceived = await sumPaymentsForPipelineOutsideTx(pipeline.id, quotation.id);
    if (quotation.subtotal > 0 && alreadyReceived >= quotation.subtotal) {
      return { ok: false, error: "This quotation is already fully paid." };
    }

    const result = await db.$transaction(async (tx) => {
      const priorReceived = await sumPaymentsInTx(tx, pipeline.id, quotation.id);
      const category =
        priorReceived >= quotation.initialPayment ? "Balance Payment" : "Initial Payment";

      let transactionId: string | null = null;

      if (d.createEarning) {
        const txn = await tx.transaction.create({
          data: {
            type: TransactionType.EARNING,
            amount: d.amountPaise,
            date: paidAt,
            category,
            description: emptyToNull(d.notes) ?? `Payment for ${pipeline.code}`,
            businessId: pipeline.businessId,
            pipelineId: pipeline.id,
            quotationId: quotation.id,
            reference: emptyToNull(d.reference),
            createdById: member.id,
          },
        });
        transactionId = txn.id;
      }

      const payment = await tx.payment.create({
        data: {
          pipelineId: pipeline.id,
          quotationId: quotation.id,
          amount: d.amountPaise,
          date: paidAt,
          method: d.method ?? PaymentMethod.BANK_TRANSFER,
          reference: emptyToNull(d.reference),
          notes: emptyToNull(d.notes),
          transactionId,
          createdById: member.id,
        },
      });

      const received = await sumPaymentsInTx(tx, pipeline.id, quotation.id);
      let promoted = false;

      // Gate: only promote Quotation → PM when initial threshold is newly met.
      if (
        pipeline.currentPhase === PhaseType.QUOTATION &&
        received >= quotation.initialPayment
      ) {
        await promotePhaseInTx(tx, {
          pipelineId: pipeline.id,
          actorId: member.id,
          notes: "Promoted after initial payment threshold met",
          viaPaymentGate: true,
        });
        promoted = true;
      }

      const fullyPaid = quotation.subtotal === 0 || received >= quotation.subtotal;
      return { paymentId: payment.id, promoted, received, fullyPaid, category };
    });

    await logActivity({
      actorId: member.id,
      action: "payment.recorded",
      entityType: "Payment",
      entityId: result.paymentId,
      businessId: pipeline.businessId,
      pipelineId: pipeline.id,
      metadata: {
        amount: d.amountPaise,
        quotationId: quotation.id,
        category: result.category,
        promoted: result.promoted,
        received: result.received,
        initialRequired: quotation.initialPayment,
        contractTotal: quotation.subtotal,
        fullyPaid: result.fullyPaid,
        notes: emptyToNull(d.notes),
      },
    });

    if (result.promoted) {
      await logActivity({
        actorId: member.id,
        action: "pipeline.promoted",
        entityType: "Pipeline",
        entityId: pipeline.id,
        businessId: pipeline.businessId,
        pipelineId: pipeline.id,
        metadata: {
          from: "QUOTATION",
          to: "PROJECT_MANAGEMENT",
          via: "payment",
        },
      });
    }

    return {
      ok: true,
      id: result.paymentId,
      promoted: result.promoted,
      fullyPaid: result.fullyPaid,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not record payment.",
    };
  }
}

async function sumPaymentsForPipelineOutsideTx(pipelineId: string, quotationId: string) {
  const result = await db.payment.aggregate({
    where: { pipelineId, quotationId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
