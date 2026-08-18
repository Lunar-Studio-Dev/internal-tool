import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

async function resolveAssignees(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (unique.length === 0) return new Map();
  const members = await db.teamMember.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return new Map(members.map((m) => [m.id, m.name]));
}

/** Follow-ups for a pipeline (pending first, then by due date). */
export async function listFollowUpsForPipeline(pipelineId: string) {
  await requirePermission("pipeline:read");
  const items = await db.followUp.findMany({
    where: { pipelineId },
    orderBy: [{ completedAt: { sort: "asc", nulls: "first" } }, { dueAt: "asc" }],
  });
  const names = await resolveAssignees(items.map((f) => f.assigneeId));
  return items.map((f) => ({
    ...f,
    assigneeName: f.assigneeId ? (names.get(f.assigneeId) ?? null) : null,
  }));
}
export type FollowUpItem = Awaited<ReturnType<typeof listFollowUpsForPipeline>>[number];
