import "server-only";

import { createQuotationSchema } from "@/features/phases/schemas/phase.schema";
import { PhaseStatus, PhaseType, PipelineStatus, QuotationVersionStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true; id?: string; version?: number } | { ok: false; error: string };

export async function createQuotationVersionAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");
  const parsed = createQuotationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const validUntil = d.validUntil ? new Date(d.validUntil) : null;
  if (validUntil && Number.isNaN(validUntil.getTime())) {
    return { ok: false, error: "Pick a valid until date." };
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const pipeline = await tx.pipeline.findUnique({ where: { id: d.pipelineId } });
      if (!pipeline) throw new Error("Pipeline not found.");
      if (pipeline.status !== PipelineStatus.ACTIVE) {
        throw new Error("Only an active pipeline can receive quotations.");
      }
      if (pipeline.currentPhase !== PhaseType.QUOTATION) {
        throw new Error("Quotations can only be created in the Quotation phase.");
      }

      const phase = await tx.pipelinePhase.findUnique({
        where: { pipelineId_type: { pipelineId: d.pipelineId, type: PhaseType.QUOTATION } },
      });
      if (!phase || phase.status !== PhaseStatus.ACTIVE) {
        throw new Error("The quotation phase is not active.");
      }

      const latest = await tx.quotation.findFirst({
        where: { pipelineId: d.pipelineId },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const version = (latest?.version ?? 0) + 1;

      if (d.publish) {
        await tx.quotation.updateMany({
          where: { pipelineId: d.pipelineId, status: QuotationVersionStatus.CURRENT },
          data: { status: QuotationVersionStatus.SUPERSEDED },
        });
      }

      const quotation = await tx.quotation.create({
        data: {
          pipelineId: d.pipelineId,
          version,
          title: d.title,
          scope: emptyToNull(d.scope),
          items: d.items,
          subtotal: d.subtotalPaise,
          initialPayment: d.initialPaymentPaise,
          paymentTerms: emptyToNull(d.paymentTerms),
          validUntil,
          status: d.publish ? QuotationVersionStatus.CURRENT : QuotationVersionStatus.DRAFT,
          createdById: member.id,
        },
      });

      await tx.pipelineDecision.upsert({
        where: { pipelineId: d.pipelineId },
        create: { pipelineId: d.pipelineId },
        update: {},
      });

      return { quotation, businessId: pipeline.businessId };
    });

    await logActivity({
      actorId: member.id,
      action: "quotation.created",
      entityType: "Quotation",
      entityId: created.quotation.id,
      businessId: created.businessId,
      pipelineId: d.pipelineId,
      metadata: { version: created.quotation.version, subtotal: created.quotation.subtotal },
    });

    return { ok: true, id: created.quotation.id, version: created.quotation.version };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create quotation." };
  }
}

export async function publishQuotationAction(pipelineId: string, quotationId: string): Promise<ActionResult> {
  const member = await requirePermission("pipeline:write");

  try {
    const result = await db.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id: quotationId } });
      if (!quotation || quotation.pipelineId !== pipelineId) {
        throw new Error("Quotation not found.");
      }
      if (quotation.status !== QuotationVersionStatus.DRAFT) {
        throw new Error("Only draft quotations can be published.");
      }

      await tx.quotation.updateMany({
        where: { pipelineId, status: QuotationVersionStatus.CURRENT },
        data: { status: QuotationVersionStatus.SUPERSEDED },
      });

      return tx.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationVersionStatus.CURRENT },
      });
    });

    await logActivity({
      actorId: member.id,
      action: "quotation.published",
      entityType: "Quotation",
      entityId: quotationId,
      pipelineId,
      metadata: { version: result.version },
    });
    return { ok: true, version: result.version };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not publish quotation." };
  }
}
