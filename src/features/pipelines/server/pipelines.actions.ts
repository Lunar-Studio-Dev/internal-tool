import "server-only";

import {
  createPipelineSchema,
  completePipelineSchema,
  deactivatePipelineSchema,
  promotePipelineSchema,
  reactivatePipelineSchema,
} from "@/features/pipelines/schemas/pipeline.schema";
import { nextPipelineCode } from "@/features/pipelines/server/code-generator";
import {
  completePipeline,
  deactivatePipeline,
  promotePhase,
  reactivatePipeline,
} from "@/features/pipelines/server/state-machine";
import { Prisma } from "@/generated/prisma/client";
import { PhaseStatus, PhaseType, PipelineStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true; warning?: string } | { ok: false; error: string };
export type CreatePipelineResult = { ok: true; id: string } | { ok: false; error: string };

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createPipelineAction(input: unknown): Promise<CreatePipelineResult> {
  const member = await requirePermission("pipeline:write");

  const parsed = createPipelineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { businessId, name, assigneeIds, notes } = parsed.data;

  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return { ok: false, error: "Select a valid business." };

  const uniqueAssignees = [...new Set(assigneeIds.filter(Boolean))];
  if (uniqueAssignees.length) {
    const members = await db.teamMember.findMany({
      where: { id: { in: uniqueAssignees }, status: "ACTIVE" },
      select: { id: true },
    });
    if (members.length !== uniqueAssignees.length) {
      return { ok: false, error: "One or more assignees are invalid." };
    }
  }

  let created: { id: string } | null = null;

  // Retry to absorb rare code collisions from concurrent creates.
  for (let attempt = 0; attempt < 6 && !created; attempt++) {
    const code = await nextPipelineCode();
    try {
      created = await db.$transaction(async (tx) => {
        const pipeline = await tx.pipeline.create({
          data: {
            code,
            businessId,
            name,
            notes: emptyToNull(notes),
            currentPhase: PhaseType.DISCOVERY,
            status: PipelineStatus.ACTIVE,
          },
        });
        if (uniqueAssignees.length) {
          await tx.pipelineAssignee.createMany({
            data: uniqueAssignees.map((memberId) => ({ pipelineId: pipeline.id, memberId })),
          });
        }
        await tx.pipelinePhase.create({
          data: {
            pipelineId: pipeline.id,
            type: PhaseType.DISCOVERY,
            status: PhaseStatus.ACTIVE,
          },
        });
        return { id: pipeline.id };
      });
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 5) continue;
      return { ok: false, error: "Could not create the pipeline." };
    }
  }

  if (!created) {
    return { ok: false, error: "Could not generate a unique pipeline code. Please try again." };
  }

  await logActivity({
    actorId: member.id,
    action: "pipeline.created",
    entityType: "Pipeline",
    entityId: created.id,
    businessId,
    pipelineId: created.id,
    metadata: { name },
  });
  return { ok: true, id: created.id };
}

export async function promotePipelineAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");

  const parsed = promotePipelineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await promotePhase({
      pipelineId: parsed.data.pipelineId,
      actorId: member.id,
      notes: parsed.data.notes || undefined,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not promote the pipeline." };
  }
}

export async function deactivatePipelineAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");

  const parsed = deactivatePipelineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await deactivatePipeline({
      pipelineId: parsed.data.pipelineId,
      reasonId: parsed.data.reasonId,
      actorId: member.id,
      notes: parsed.data.notes || undefined,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not deactivate the pipeline." };
  }
}

export async function reactivatePipelineAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");

  const parsed = reactivatePipelineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await reactivatePipeline({
      pipelineId: parsed.data.pipelineId,
      actorId: member.id,
      notes: parsed.data.notes || undefined,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reactivate the pipeline." };
  }
}

export async function completePipelineAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");

  const parsed = completePipelineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await completePipeline({
      pipelineId: parsed.data.pipelineId,
      actorId: member.id,
      notes: parsed.data.notes || undefined,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not complete the pipeline." };
  }
}
