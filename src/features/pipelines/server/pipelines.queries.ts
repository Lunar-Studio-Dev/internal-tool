import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

/** Resolve TeamMember ids → names (ownerId etc. are denormalized, no FK). */
async function memberNameMap(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (unique.length === 0) return new Map();
  const members = await db.teamMember.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return new Map(members.map((m) => [m.id, m.name]));
}

export async function listPipelines() {
  await requirePermission("pipeline:read");
  const pipelines = await db.pipeline.findMany({
    orderBy: { createdAt: "desc" },
    include: { business: { select: { id: true, name: true } } },
  });
  const names = await memberNameMap(pipelines.map((p) => p.ownerId));
  return pipelines.map((p) => ({
    ...p,
    ownerName: p.ownerId ? (names.get(p.ownerId) ?? null) : null,
  }));
}
export type PipelineListItem = Awaited<ReturnType<typeof listPipelines>>[number];

export async function getPipelineById(id: string) {
  await requirePermission("pipeline:read");
  const pipeline = await db.pipeline.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true } },
      phases: true,
    },
  });
  if (!pipeline) return null;

  const names = await memberNameMap([pipeline.ownerId, pipeline.deactivatedById]);
  let reasonLabel: string | null = null;
  if (pipeline.deactivationReasonId) {
    const reason = await db.deactivationReason.findUnique({
      where: { id: pipeline.deactivationReasonId },
      select: { label: true },
    });
    reasonLabel = reason?.label ?? null;
  }

  return {
    ...pipeline,
    ownerName: pipeline.ownerId ? (names.get(pipeline.ownerId) ?? null) : null,
    deactivatedByName: pipeline.deactivatedById
      ? (names.get(pipeline.deactivatedById) ?? null)
      : null,
    reasonLabel,
  };
}
export type PipelineDetail = NonNullable<Awaited<ReturnType<typeof getPipelineById>>>;

export async function listDeactivationReasons() {
  await requirePermission("pipeline:read");
  return db.deactivationReason.findMany({
    where: { enabled: true },
    orderBy: { label: "asc" },
  });
}

/** Active members for the pipeline assignee picker. */
export async function listActiveMembersForAssignee() {
  await requirePermission("pipeline:read");
  return db.teamMember.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Lightweight business options for the create-pipeline combobox. */
export async function listBusinessOptions() {
  await requirePermission("pipeline:read");
  return db.business.findMany({
    select: { id: true, name: true, website: true },
    orderBy: { name: "asc" },
  });
}

export type PipelineActivityItem = {
  id: string;
  action: string;
  createdAt: Date;
  metadata: unknown;
  actorName: string | null;
};

/** Scoped audit timeline for a pipeline, with actor names resolved. */
export async function getPipelineActivity(
  pipelineId: string,
  limit = 30,
): Promise<PipelineActivityItem[]> {
  await requirePermission("pipeline:read");
  const logs = await db.activityLog.findMany({
    where: { pipelineId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const names = await memberNameMap(logs.map((l) => l.actorId));
  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    createdAt: l.createdAt,
    metadata: l.metadata,
    actorName: l.actorId ? (names.get(l.actorId) ?? null) : null,
  }));
}
