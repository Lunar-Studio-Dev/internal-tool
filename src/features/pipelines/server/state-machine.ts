import "server-only";

import { nextPhase } from "@/features/pipelines/constants";
import { PhaseStatus, PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";

export type TransitionResult = {
  businessId: string;
  from: PhaseType;
  to?: PhaseType;
};

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

  const result = await db.$transaction(async (tx) => {
    const pipeline = await tx.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new Error("Pipeline not found.");
    if (pipeline.status !== PipelineStatus.ACTIVE) {
      throw new Error("Only an active pipeline can be promoted.");
    }

    const from = pipeline.currentPhase;
    const to = nextPhase(from);
    if (!to) throw new Error("This pipeline is already at the final phase.");
    // Quotation → Project Management is gated by payment (PHASE_8), not a plain promote.
    if (from === PhaseType.QUOTATION && to === PhaseType.PROJECT_MANAGEMENT) {
      throw new Error("Moving to Project Management is gated by payment and isn't available yet.");
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

    // Idempotent on the unique (pipelineId, type): create the next phase ACTIVE.
    await tx.pipelinePhase.upsert({
      where: { pipelineId_type: { pipelineId, type: to } },
      create: { pipelineId, type: to, status: PhaseStatus.ACTIVE, ownerId: pipeline.ownerId },
      update: { status: PhaseStatus.ACTIVE },
    });

    await tx.pipeline.update({ where: { id: pipelineId }, data: { currentPhase: to } });

    return { businessId: pipeline.businessId, from, to } satisfies TransitionResult;
  });

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
