import "server-only";

import { isFinalPhase, isPipelineDeactivationLocked, nextPhase } from "@/features/pipelines/constants";
import { PhaseStatus, PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";

export type TransitionResult = {
  businessId: string;
  from: PhaseType;
  to?: PhaseType;
};

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Core promote used inside an existing transaction. Quotation → Project
 * Management is blocked unless `viaPaymentGate` is true (PHASE_8 only path).
 */
export async function promotePhaseInTx(
  tx: Tx,
  params: {
    pipelineId: string;
    actorId: string;
    notes?: string;
    viaPaymentGate?: boolean;
  },
): Promise<TransitionResult> {
  const { pipelineId, actorId, notes, viaPaymentGate = false } = params;

  const pipeline = await tx.pipeline.findUnique({ where: { id: pipelineId } });
  if (!pipeline) throw new Error("Pipeline not found.");
  if (pipeline.status !== PipelineStatus.ACTIVE) {
    throw new Error("Only an active pipeline can be promoted.");
  }

  const from = pipeline.currentPhase;
  const to = nextPhase(from);
  if (!to) throw new Error("This pipeline is already at the final phase.");

  if (from === PhaseType.QUOTATION && to === PhaseType.PROJECT_MANAGEMENT && !viaPaymentGate) {
    throw new Error("Moving to Project Management requires the initial payment to be recorded.");
  }
  if (viaPaymentGate && !(from === PhaseType.QUOTATION && to === PhaseType.PROJECT_MANAGEMENT)) {
    throw new Error("Payment gate only applies when promoting Quotation to Project Management.");
  }

  const current = await tx.pipelinePhase.findUnique({
    where: { pipelineId_type: { pipelineId, type: from } },
  });
  if (!current || current.status !== PhaseStatus.ACTIVE) {
    throw new Error("The current phase is not active.");
  }

  await tx.pipelinePhase.update({
    where: { id: current.id },
    data: {
      status: PhaseStatus.PROMOTED,
      promotedAt: new Date(),
      promotedById: actorId,
      promoteNotes: notes ?? null,
    },
  });

  await tx.pipelinePhase.upsert({
    where: { pipelineId_type: { pipelineId, type: to } },
    create: { pipelineId, type: to, status: PhaseStatus.ACTIVE },
    update: { status: PhaseStatus.ACTIVE },
  });

  await tx.pipeline.update({ where: { id: pipelineId }, data: { currentPhase: to } });

  return { businessId: pipeline.businessId, from, to };
}

/**
 * Advance a pipeline to the next phase (forward-only, sequential). Runs in a
 * transaction; illegal transitions throw and change nothing. Callers gate on
 * `pipeline:write` and translate thrown errors into user-facing messages.
 */
export async function promotePhase(params: {
  pipelineId: string;
  actorId: string;
  notes?: string;
}): Promise<TransitionResult> {
  const { pipelineId, actorId, notes } = params;

  const result = await db.$transaction(async (tx) =>
    promotePhaseInTx(tx, { pipelineId, actorId, notes, viaPaymentGate: false }),
  );

  await logActivity({
    actorId,
    action: "pipeline.promoted",
    entityType: "Pipeline",
    entityId: pipelineId,
    businessId: result.businessId,
    pipelineId,
    metadata: { from: result.from, to: result.to },
  });

  return result;
}

/**
 * Deactivate an active pipeline with a required reason. The owning Business
 * stays active. Deactivation notes are recorded on the activity log rather than
 * clobbering the pipeline's own notes.
 */
export async function deactivatePipeline(params: {
  pipelineId: string;
  reasonId: string;
  actorId: string;
  notes?: string;
}): Promise<TransitionResult & { reasonLabel: string }> {
  const { pipelineId, reasonId, actorId, notes } = params;

  const result = await db.$transaction(async (tx) => {
    const pipeline = await tx.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new Error("Pipeline not found.");
    if (pipeline.status !== PipelineStatus.ACTIVE) {
      throw new Error("This pipeline is not active.");
    }

    const project = await tx.project.findUnique({
      where: { pipelineId },
      select: { id: true },
    });
    if (
      isPipelineDeactivationLocked({
        currentPhase: pipeline.currentPhase,
        handedOff: Boolean(project),
        scope: "api",
      })
    ) {
      throw new Error(
        "This pipeline has been handed to the development team and cannot be deactivated.",
      );
    }

    const reason = await tx.deactivationReason.findUnique({ where: { id: reasonId } });
    if (!reason || !reason.enabled) throw new Error("Choose a valid deactivation reason.");

    await tx.pipelinePhase.updateMany({
      where: { pipelineId, type: pipeline.currentPhase, status: PhaseStatus.ACTIVE },
      data: { status: PhaseStatus.DEACTIVATED },
    });

    await tx.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: PipelineStatus.DEACTIVATED,
        deactivationReasonId: reasonId,
        deactivatedAt: new Date(),
        deactivatedById: actorId,
        deactivationCount: { increment: 1 },
      },
    });

    await tx.deactivationReason.update({
      where: { id: reasonId },
      data: { usageCount: { increment: 1 } },
    });

    return { businessId: pipeline.businessId, from: pipeline.currentPhase, reasonLabel: reason.label };
  });

  await logActivity({
    actorId,
    action: "pipeline.deactivated",
    entityType: "Pipeline",
    entityId: pipelineId,
    businessId: result.businessId,
    pipelineId,
    metadata: { reason: result.reasonLabel, phase: result.from, notes: notes ?? null },
  });

  return result;
}

/**
 * Reactivate a deactivated pipeline. Resumes at the phase it was stopped at
 * (`currentPhase` is never mutated on deactivate, so it already holds it) by
 * flipping that phase row back to ACTIVE and the pipeline to ACTIVE. History and
 * the prior deactivation stamps are preserved; `reactivationCount` is bumped. The
 * status guard inside the transaction keeps a double-submit from double-counting.
 */
export async function reactivatePipeline(params: {
  pipelineId: string;
  actorId: string;
  notes?: string;
}): Promise<TransitionResult> {
  const { pipelineId, actorId, notes } = params;

  const result = await db.$transaction(async (tx) => {
    const pipeline = await tx.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new Error("Pipeline not found.");
    if (pipeline.status !== PipelineStatus.DEACTIVATED) {
      throw new Error("Only a deactivated pipeline can be reactivated.");
    }

    const resume = pipeline.currentPhase;

    await tx.pipelinePhase.updateMany({
      where: { pipelineId, type: resume, status: PhaseStatus.DEACTIVATED },
      data: { status: PhaseStatus.ACTIVE },
    });

    await tx.pipeline.update({
      where: { id: pipelineId },
      data: {
        status: PipelineStatus.ACTIVE,
        reactivatedAt: new Date(),
        reactivatedById: actorId,
        reactivationCount: { increment: 1 },
      },
    });

    return { businessId: pipeline.businessId, from: resume, to: resume };
  });

  await logActivity({
    actorId,
    action: "pipeline.reactivated",
    entityType: "Pipeline",
    entityId: pipelineId,
    businessId: result.businessId,
    pipelineId,
    metadata: { phase: result.to, notes: notes ?? null },
  });

  return result;
}

/**
 * Mark a handed-off pipeline as completed (won). Requires final phase + project
 * handoff. Idempotent when already completed.
 */
export async function completePipeline(params: {
  pipelineId: string;
  actorId: string;
  notes?: string;
}): Promise<TransitionResult> {
  const { pipelineId, actorId, notes } = params;

  const result = await db.$transaction(async (tx) => {
    const pipeline = await tx.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new Error("Pipeline not found.");
    if (pipeline.status === PipelineStatus.COMPLETED) {
      return { businessId: pipeline.businessId, from: pipeline.currentPhase, alreadyCompleted: true };
    }
    if (pipeline.status !== PipelineStatus.ACTIVE) {
      throw new Error("Only an active pipeline can be completed.");
    }
    if (!isFinalPhase(pipeline.currentPhase)) {
      throw new Error("The pipeline must reach the final phase before it can be completed.");
    }

    const project = await tx.project.findUnique({
      where: { pipelineId },
      select: { id: true },
    });
    if (!project) {
      throw new Error("Hand the project to the development team before completing the pipeline.");
    }

    await tx.pipelinePhase.updateMany({
      where: { pipelineId, type: pipeline.currentPhase, status: PhaseStatus.ACTIVE },
      data: {
        status: PhaseStatus.PROMOTED,
        promotedAt: new Date(),
        promotedById: actorId,
        promoteNotes: notes ?? null,
      },
    });

    await tx.pipeline.update({
      where: { id: pipelineId },
      data: { status: PipelineStatus.COMPLETED },
    });

    return { businessId: pipeline.businessId, from: pipeline.currentPhase, alreadyCompleted: false };
  });

  if (!result.alreadyCompleted) {
    await logActivity({
      actorId,
      action: "pipeline.completed",
      entityType: "Pipeline",
      entityId: pipelineId,
      businessId: result.businessId,
      pipelineId,
      metadata: { phase: result.from, notes: notes ?? null },
    });
  }

  return { businessId: result.businessId, from: result.from };
}
