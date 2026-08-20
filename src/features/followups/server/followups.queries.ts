import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";

/** Follow-ups for a pipeline (pending first, then by due date). */
export async function listFollowUpsForPipeline(pipelineId: string) {
  await requirePermission("pipeline:read");
  const items = await db.followUp.findMany({
    where: { pipelineId },
    orderBy: [{ completedAt: { sort: "asc", nulls: "first" } }, { dueAt: "asc" }],
    include: {
      _count: { select: { reschedules: true } },
    },
  });
  const names = await memberNameMap(items.map((f) => f.assigneeId));
  return items.map(({ _count, ...f }) => ({
    ...f,
    assigneeName: f.assigneeId ? (names.get(f.assigneeId) ?? null) : null,
    rescheduleCount: _count.reschedules,
  }));
}
export type FollowUpItem = Awaited<ReturnType<typeof listFollowUpsForPipeline>>[number];

/** Follow-ups for a business (pending first, then by due date). */
export async function listFollowUpsForBusiness(businessId: string) {
  await requirePermission("business:read");
  const items = await db.followUp.findMany({
    where: { businessId },
    orderBy: [{ completedAt: { sort: "asc", nulls: "first" } }, { dueAt: "asc" }],
    include: {
      _count: { select: { reschedules: true } },
    },
  });
  const names = await memberNameMap(items.map((f) => f.assigneeId));
  return items.map(({ _count, ...f }) => ({
    ...f,
    assigneeName: f.assigneeId ? (names.get(f.assigneeId) ?? null) : null,
    rescheduleCount: _count.reschedules,
  }));
}

export async function listReschedulesForFollowUp(followUpId: string) {
  await requirePermission("pipeline:read");
  const items = await db.followUpReschedule.findMany({
    where: { followUpId },
    orderBy: { createdAt: "desc" },
  });
  const names = await memberNameMap(items.map((r) => r.rescheduledById));
  return items.map((r) => ({
    ...r,
    rescheduledByName: r.rescheduledById ? (names.get(r.rescheduledById) ?? null) : null,
  }));
}
