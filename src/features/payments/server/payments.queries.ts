import "server-only";

import {
  ClientDecision,
  PhaseType,
  PipelineStatus,
  QuotationVersionStatus,
  TransactionType,
} from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";

/**
 * Dual-threshold payment status (Option A):
 * - Initial payment unlocks Project Management / handover
 * - Contract total (quotation subtotal) keeps Payments open until fully paid
 */
export type PaymentStatusSummary = {
  quotationId: string | null;
  quotationVersion: number | null;
  /** Full quotation value (contract). */
  contractTotalPaise: number;
  /** Advance / gate amount. */
  initialRequiredPaise: number;
  receivedPaise: number;
  initialRemainingPaise: number;
  contractRemainingPaise: number;
  /** @deprecated Prefer initialRequiredPaise — kept for older UI. */
  requiredPaise: number;
  /** @deprecated Prefer initialRemainingPaise when speaking about the gate. */
  remainingPaise: number;
  decision: ClientDecision | null;
  currentPhase: PhaseType;
  initialMet: boolean;
  fullyPaid: boolean;
  /** Still collecting money toward the contract total. */
  canRecordPayment: boolean;
  /** Initial met and pipeline is in Project Management (handover eligible). */
  canHandover: boolean;
  /** Quotation phase, waiting on initial. */
  awaitingInitial: boolean;
};

/** Payment status for the pipeline's CURRENT quotation. */
export async function getPaymentStatusForPipeline(
  pipelineId: string,
): Promise<PaymentStatusSummary> {
  await requirePermission("payment:read");

  const pipeline = await db.pipeline.findUnique({
    where: { id: pipelineId },
    select: {
      status: true,
      currentPhase: true,
      decision: { select: { decision: true } },
    },
  });
  if (!pipeline) throw new Error("Pipeline not found.");

  const quotation = await db.quotation.findFirst({
    where: { pipelineId, status: QuotationVersionStatus.CURRENT },
    select: { id: true, version: true, subtotal: true, initialPayment: true },
  });

  const received = quotation
    ? await db.payment.aggregate({
        where: { pipelineId, quotationId: quotation.id },
        _sum: { amount: true },
      })
    : { _sum: { amount: null } };

  const initialRequiredPaise = quotation?.initialPayment ?? 0;
  const contractTotalPaise = quotation?.subtotal ?? 0;
  const receivedPaise = received._sum.amount ?? 0;
  const initialRemainingPaise = Math.max(0, initialRequiredPaise - receivedPaise);
  const contractRemainingPaise = Math.max(0, contractTotalPaise - receivedPaise);
  const decision = pipeline.decision?.decision ?? null;
  const accepted = decision === ClientDecision.ACCEPTED;
  const initialMet =
    accepted && (initialRequiredPaise === 0 || receivedPaise >= initialRequiredPaise);
  const fullyPaid =
    accepted && (contractTotalPaise === 0 || receivedPaise >= contractTotalPaise);
  const active = pipeline.status === PipelineStatus.ACTIVE;
  const inQuotation = pipeline.currentPhase === PhaseType.QUOTATION;
  const inProject = pipeline.currentPhase === PhaseType.PROJECT_MANAGEMENT;

  return {
    quotationId: quotation?.id ?? null,
    quotationVersion: quotation?.version ?? null,
    contractTotalPaise,
    initialRequiredPaise,
    receivedPaise,
    initialRemainingPaise,
    contractRemainingPaise,
    requiredPaise: initialRequiredPaise,
    remainingPaise: initialRemainingPaise,
    decision,
    currentPhase: pipeline.currentPhase,
    initialMet,
    fullyPaid,
    canRecordPayment:
      active && accepted && Boolean(quotation) && !fullyPaid && (inQuotation || inProject),
    canHandover: active && accepted && initialMet && inProject,
    awaitingInitial: active && accepted && inQuotation && !initialMet,
  };
}
export type PaymentStatus = Awaited<ReturnType<typeof getPaymentStatusForPipeline>>;

export async function listPaymentsForPipeline(pipelineId: string) {
  await requirePermission("payment:read");
  const items = await db.payment.findMany({
    where: { pipelineId },
    orderBy: { date: "desc" },
  });
  const names = await memberNameMap(items.map((p) => p.createdById));
  return items.map((p) => ({
    ...p,
    createdByName: p.createdById ? (names.get(p.createdById) ?? null) : null,
  }));
}
export type PaymentItem = Awaited<ReturnType<typeof listPaymentsForPipeline>>[number];

export async function sumPaymentsForQuotation(
  pipelineId: string,
  quotationId: string,
): Promise<number> {
  const result = await db.payment.aggregate({
    where: { pipelineId, quotationId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Used by recordPayment inside a transaction. */
export async function sumPaymentsInTx(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  pipelineId: string,
  quotationId: string,
): Promise<number> {
  const result = await tx.payment.aggregate({
    where: { pipelineId, quotationId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Record payments while collecting toward the full contract (Quotation or PM). */
export function isPipelinePaymentEligible(pipeline: {
  status: PipelineStatus;
  currentPhase: PhaseType;
}): boolean {
  if (pipeline.status !== PipelineStatus.ACTIVE) return false;
  return (
    pipeline.currentPhase === PhaseType.QUOTATION ||
    pipeline.currentPhase === PhaseType.PROJECT_MANAGEMENT
  );
}

export { TransactionType };
