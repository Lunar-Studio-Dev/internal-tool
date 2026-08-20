import "server-only";

import { createFollowUpSchema, updateFollowUpSchema } from "@/features/followups/schemas/followup.schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/utils";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
  return { ok: true };
}

export async function updateFollowUpAction(id: string, input: unknown): Promise<ActionResult> {
  const member = await requirePermission("task:write");

  const parsed = updateFollowUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const existing = await db.followUp.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Follow-up not found." };
  if (existing.completedAt) return { ok: false, error: "Completed follow-ups cannot be edited." };

  const dueAt = new Date(d.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    return { ok: false, error: "Pick a valid date and time." };
  }

  const dueChanged = existing.dueAt.getTime() !== dueAt.getTime();

  try {
    await db.$transaction(async (tx) => {
      if (dueChanged) {
        await tx.followUpReschedule.create({
          data: {
            followUpId: id,
            previousDueAt: existing.dueAt,
            newDueAt: dueAt,
            rescheduledById: member.id,
            notes: emptyToNull(d.rescheduleNotes),
          },
        });
      }

      await tx.followUp.update({
        where: { id },
        data: {
          reason: d.reason,
          dueAt,
          assigneeId: emptyToNull(d.assigneeId),
          notes: emptyToNull(d.notes),
        },
      });
    });

    await logActivity({
      actorId: member.id,
      action: dueChanged ? "followup.rescheduled" : "followup.updated",
      entityType: "FollowUp",
      entityId: id,
      businessId: existing.businessId,
      pipelineId: existing.pipelineId,
      metadata: dueChanged
        ? { previousDueAt: existing.dueAt.toISOString(), newDueAt: dueAt.toISOString() }
        : { reason: d.reason },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the follow-up." };
  }
}
