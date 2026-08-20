import "server-only";

import { DEFAULT_CHECKLIST } from "@/features/phases/constants";
import {
  saveBusinessResearchSchema,
  saveDiscoverySchema,
  saveRequirementSchema,
  saveUnderstandingSchema,
} from "@/features/phases/schemas/phase.schema";
import { PhaseStatus, PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertWritablePipeline(pipelineId: string, expectedPhase?: PhaseType) {
  const pipeline = await db.pipeline.findUnique({ where: { id: pipelineId } });
  if (!pipeline) throw new Error("Pipeline not found.");
  if (pipeline.status !== PipelineStatus.ACTIVE) {
    throw new Error("Only an active pipeline can be updated.");
  }
  if (expectedPhase && pipeline.currentPhase !== expectedPhase) {
    throw new Error("This content belongs to a different phase.");
  }
  const phase = await db.pipelinePhase.findUnique({
    where: { pipelineId_type: { pipelineId, type: pipeline.currentPhase } },
  });
  if (!phase || phase.status !== PhaseStatus.ACTIVE) {
    throw new Error("The current phase is not active.");
  }
  return pipeline;
}

export async function saveDiscoveryAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");
  const parsed = saveDiscoverySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const pipeline = await assertWritablePipeline(d.pipelineId, PhaseType.DISCOVERY);
    const meetingAt = d.meetingAt ? new Date(d.meetingAt) : null;
    if (meetingAt && Number.isNaN(meetingAt.getTime())) {
      return { ok: false, error: "Pick a valid meeting date and time." };
    }

    await db.discovery.upsert({
      where: { pipelineId: d.pipelineId },
      create: {
        pipelineId: d.pipelineId,
        meetingAt,
        meetingLink: emptyToNull(d.meetingLink),
        meetingOwnerId: emptyToNull(d.meetingOwnerId),
        notes: emptyToNull(d.notes),
        checklist: d.checklist,
      },
      update: {
        meetingAt,
        meetingLink: emptyToNull(d.meetingLink),
        meetingOwnerId: emptyToNull(d.meetingOwnerId),
        notes: emptyToNull(d.notes),
        checklist: d.checklist,
      },
    });

    await logActivity({
      actorId: member.id,
      action: "phase.discovery.saved",
      entityType: "Pipeline",
      entityId: d.pipelineId,
      businessId: pipeline.businessId,
      pipelineId: d.pipelineId,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save discovery." };
  }
}

export async function saveUnderstandingAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");
  const parsed = saveUnderstandingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const pipeline = await assertWritablePipeline(d.pipelineId, PhaseType.BUSINESS_UNDERSTANDING);

    await db.businessUnderstanding.upsert({
      where: { pipelineId: d.pipelineId },
      create: {
        pipelineId: d.pipelineId,
        model: emptyToNull(d.model),
        operations: emptyToNull(d.operations),
        processes: emptyToNull(d.processes),
        painPoints: d.painPoints ?? [],
        opportunities: d.opportunities ?? [],
        stakeholders: d.stakeholders ?? [],
      },
      update: {
        model: emptyToNull(d.model),
        operations: emptyToNull(d.operations),
        processes: emptyToNull(d.processes),
        painPoints: d.painPoints ?? [],
        opportunities: d.opportunities ?? [],
        stakeholders: d.stakeholders ?? [],
      },
    });

    await logActivity({
      actorId: member.id,
      action: "phase.understanding.saved",
      entityType: "Pipeline",
      entityId: d.pipelineId,
      businessId: pipeline.businessId,
      pipelineId: d.pipelineId,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save understanding." };
  }
}

export async function saveRequirementAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");
  const parsed = saveRequirementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const pipeline = await assertWritablePipeline(d.pipelineId, PhaseType.REQUIREMENT);

    await db.requirement.upsert({
      where: { pipelineId: d.pipelineId },
      create: {
        pipelineId: d.pipelineId,
        templateKey: emptyToNull(d.templateKey),
        businessReq: emptyToNull(d.businessReq),
        functionalReq: emptyToNull(d.functionalReq),
        technicalReq: emptyToNull(d.technicalReq),
        features: d.features ?? [],
        users: d.users ?? [],
        integrations: emptyToNull(d.integrations),
        timeline: emptyToNull(d.timeline),
        constraints: emptyToNull(d.constraints),
        questionnaire: (d.questionnaire ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        templateKey: emptyToNull(d.templateKey),
        businessReq: emptyToNull(d.businessReq),
        functionalReq: emptyToNull(d.functionalReq),
        technicalReq: emptyToNull(d.technicalReq),
        features: d.features ?? [],
        users: d.users ?? [],
        integrations: emptyToNull(d.integrations),
        timeline: emptyToNull(d.timeline),
        constraints: emptyToNull(d.constraints),
        questionnaire: (d.questionnaire ?? {}) as Prisma.InputJsonValue,
      },
    });

    await logActivity({
      actorId: member.id,
      action: "phase.requirement.saved",
      entityType: "Pipeline",
      entityId: d.pipelineId,
      businessId: pipeline.businessId,
      pipelineId: d.pipelineId,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save requirements." };
  }
}

export async function saveBusinessResearchAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");
  const parsed = saveBusinessResearchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const pipeline = await db.pipeline.findUnique({ where: { id: parsed.data.pipelineId } });
    if (!pipeline) return { ok: false, error: "Pipeline not found." };

    const existing = (await db.business.findUnique({
      where: { id: pipeline.businessId },
      select: { metrics: true },
    }))?.metrics as Record<string, unknown> | null;

    await db.business.update({
      where: { id: pipeline.businessId },
      data: {
        metrics: {
          ...(existing ?? {}),
          researchNotes: emptyToNull(parsed.data.researchNotes),
        },
      },
    });

    await logActivity({
      actorId: member.id,
      action: "phase.research.saved",
      entityType: "Business",
      entityId: pipeline.businessId,
      businessId: pipeline.businessId,
      pipelineId: pipeline.id,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save business research." };
  }
}

export { DEFAULT_CHECKLIST };
