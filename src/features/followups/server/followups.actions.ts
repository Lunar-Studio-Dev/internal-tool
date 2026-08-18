"use server";

import { revalidatePath } from "next/cache";

import { createFollowUpSchema } from "@/features/followups/schemas/followup.schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

function emptyToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function revalidateContexts(followUp: { businessId: string | null; pipelineId: string | null }) {
  if (followUp.businessId) revalidatePath(`/businesses/${followUp.businessId}`);
  if (followUp.pipelineId) revalidatePath(`/pipelines/${followUp.pipelineId}`);
}

export async function createFollowUpAction(input: unknown): Promise<ActionResult> {
  const member = await requirePermission("task:write");

  const parsed = createFollowUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const dueAt = new Date(d.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    return { ok: false, error: "Pick a valid date and time." };
  }

  try {
    const followUp = await db.followUp.create({
      data: {
        businessId: emptyToNull(d.businessId),
        pipelineId: emptyToNull(d.pipelineId),
        phaseType: d.phaseType ? d.phaseType : null,
        reason: d.reason,
        dueAt,
        assigneeId: emptyToNull(d.assigneeId),
        notes: emptyToNull(d.notes),
        createdById: member.id,
      },
    });
    await logActivity({
      actorId: member.id,
      action: "followup.created",
      entityType: "FollowUp",
      entityId: followUp.id,
      businessId: followUp.businessId,
      pipelineId: followUp.pipelineId,
      metadata: { reason: followUp.reason },
    });
    revalidateContexts(followUp);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not create the follow-up." };
  }
}

export async function completeFollowUpAction(id: string): Promise<ActionResult> {
  const member = await requirePermission("task:write");

  const existing = await db.followUp.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Follow-up not found." };
  if (existing.completedAt) return { ok: true };

  const followUp = await db.followUp.update({
    where: { id },
    data: { completedAt: new Date() },
  });
  await logActivity({
    actorId: member.id,
    action: "followup.completed",
    entityType: "FollowUp",
    entityId: id,
    businessId: followUp.businessId,
    pipelineId: followUp.pipelineId,
    metadata: { reason: followUp.reason },
  });
  revalidateContexts(followUp);
  return { ok: true };
}
