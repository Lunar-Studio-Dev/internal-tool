import "server-only";

import { clientDecisionSchema } from "@/features/phases/schemas/phase.schema";
import { deactivatePipeline } from "@/features/pipelines/server/state-machine";
import { ClientDecision, PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setClientDecisionAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");
  const parsed = clientDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const pipeline = await db.pipeline.findUnique({ where: { id: d.pipelineId } });
    if (!pipeline) return { ok: false, error: "Pipeline not found." };
    if (pipeline.status !== PipelineStatus.ACTIVE) {
      return { ok: false, error: "Only an active pipeline can receive a client decision." };
    }
    if (pipeline.currentPhase !== PhaseType.QUOTATION) {
      return { ok: false, error: "Client decisions apply in the Quotation phase." };
    }

    const currentQuotation = await db.quotation.findFirst({
      where: { pipelineId: d.pipelineId, status: "CURRENT" },
    });
    if (!currentQuotation) {
      return { ok: false, error: "Publish a quotation before recording a client decision." };
    }

    if (d.decision === "REJECTED") {
      if (!d.reasonId) return { ok: false, error: "Choose a deactivation reason." };
      await db.pipelineDecision.upsert({
        where: { pipelineId: d.pipelineId },
        create: {
          pipelineId: d.pipelineId,
          decision: ClientDecision.REJECTED,
          decidedAt: new Date(),
          notes: emptyToNull(d.notes),
        },
        update: {
          decision: ClientDecision.REJECTED,
          decidedAt: new Date(),
          notes: emptyToNull(d.notes),
        },
      });
      await deactivatePipeline({
        pipelineId: d.pipelineId,
        reasonId: d.reasonId,
        actorId: member.id,
        notes: d.notes || undefined,
      });
      await logActivity({
        actorId: member.id,
        action: "quotation.rejected",
        entityType: "Pipeline",
        entityId: d.pipelineId,
        businessId: pipeline.businessId,
        pipelineId: d.pipelineId,
        metadata: { quotationVersion: currentQuotation.version },
      });
      return { ok: true };
    }

    if (d.decision === "LATER") {
      if (!d.followUpDueAt) return { ok: false, error: "Pick a follow-up date." };
      const dueAt = new Date(d.followUpDueAt);
      if (Number.isNaN(dueAt.getTime())) return { ok: false, error: "Pick a valid follow-up date." };

      await db.$transaction(async (tx) => {
        await tx.pipelineDecision.upsert({
          where: { pipelineId: d.pipelineId },
          create: {
            pipelineId: d.pipelineId,
            decision: ClientDecision.LATER,
            decidedAt: new Date(),
            notes: emptyToNull(d.notes),
          },
          update: {
            decision: ClientDecision.LATER,
            decidedAt: new Date(),
            notes: emptyToNull(d.notes),
          },
        });
        await tx.followUp.create({
          data: {
            businessId: pipeline.businessId,
            pipelineId: d.pipelineId,
            phaseType: PhaseType.QUOTATION,
            reason: d.followUpReason?.trim() || "Client asked to revisit later",
            dueAt,
            assigneeId: pipeline.ownerId,
            notes: emptyToNull(d.notes),
            createdById: member.id,
          },
        });
      });

      await logActivity({
        actorId: member.id,
        action: "quotation.deferred",
        entityType: "Pipeline",
        entityId: d.pipelineId,
        businessId: pipeline.businessId,
        pipelineId: d.pipelineId,
        metadata: { followUpDueAt: d.followUpDueAt },
      });
      return { ok: true };
    }

    // ACCEPTED → payment pending (PHASE_8); pipeline stays in Quotation.
    await db.pipelineDecision.upsert({
      where: { pipelineId: d.pipelineId },
      create: {
        pipelineId: d.pipelineId,
        decision: ClientDecision.ACCEPTED,
        decidedAt: new Date(),
        notes: emptyToNull(d.notes),
      },
      update: {
        decision: ClientDecision.ACCEPTED,
        decidedAt: new Date(),
        notes: emptyToNull(d.notes),
      },
    });

    await logActivity({
      actorId: member.id,
      action: "quotation.accepted",
      entityType: "Pipeline",
      entityId: d.pipelineId,
      businessId: pipeline.businessId,
      pipelineId: d.pipelineId,
      metadata: {
        quotationVersion: currentQuotation.version,
        initialPayment: currentQuotation.initialPayment,
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not record decision." };
  }
}
