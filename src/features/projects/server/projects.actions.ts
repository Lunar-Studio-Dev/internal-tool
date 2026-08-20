import "server-only";

import { createProjectSchema } from "@/features/projects/schemas/project.schema";
import { nextProjectCodeInTx } from "@/features/projects/server/code-generator";
import { buildHandoffChecklist } from "@/features/projects/server/projects.queries";
import { PhaseType, PipelineStatus, QuotationVersionStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProjectAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("project:write");
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const pipeline = await db.pipeline.findUnique({ where: { id: d.pipelineId } });
    if (!pipeline) return { ok: false, error: "Pipeline not found." };
    if (pipeline.status !== PipelineStatus.ACTIVE) {
      return { ok: false, error: "Only an active pipeline can create a project." };
    }
    if (pipeline.currentPhase !== PhaseType.PROJECT_MANAGEMENT) {
      return { ok: false, error: "Create the project after moving to Project Management." };
    }

    const existing = await db.project.findUnique({ where: { pipelineId: d.pipelineId } });
    if (existing) return { ok: false, error: "A project already exists for this pipeline." };

    const quotation = await db.quotation.findFirst({
      where: { pipelineId: d.pipelineId, status: QuotationVersionStatus.CURRENT },
      select: { id: true },
    });

    const startDate = d.startDate ? new Date(d.startDate) : null;
    const deadline = d.deadline ? new Date(d.deadline) : null;
    if (startDate && Number.isNaN(startDate.getTime())) {
      return { ok: false, error: "Pick a valid start date." };
    }
    if (deadline && Number.isNaN(deadline.getTime())) {
      return { ok: false, error: "Pick a valid deadline." };
    }

    const { snapshot } = await buildHandoffChecklist(d.pipelineId);

    const project = await db.$transaction(async (tx) => {
      const code = await nextProjectCodeInTx(tx);
      return tx.project.create({
        data: {
          code,
          pipelineId: d.pipelineId,
          businessId: pipeline.businessId,
          quotationId: quotation?.id ?? null,
          name: d.name,
          managerId: emptyToNull(d.managerId),
          startDate,
          deadline,
          notes: emptyToNull(d.notes),
          handoff: snapshot,
          createdById: member.id,
        },
      });
    });

    await logActivity({
      actorId: member.id,
      action: "project.created",
      entityType: "Project",
      entityId: project.id,
      businessId: pipeline.businessId,
      pipelineId: pipeline.id,
      metadata: { code: project.code, name: project.name },
    });

    return { ok: true, id: project.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create the project.",
    };
  }
}
