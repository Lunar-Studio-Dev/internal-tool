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
  });
  const names = await memberNameMap(items.map((f) => f.assigneeId));
  return items.map((f) => ({
    ...f,
    assigneeName: f.assigneeId ? (names.get(f.assigneeId) ?? null) : null,
  }));
}
export type FollowUpItem = Awaited<ReturnType<typeof listFollowUpsForPipeline>>[number];
