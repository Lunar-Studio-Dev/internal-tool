import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

type TaskRecord = {
  assigneeId: string | null;
  createdById: string | null;
  businessId: string | null;
  pipelineId: string | null;
};

/** Batch-resolve the denormalized ids on a set of tasks (no FKs). */
async function resolveLookups(tasks: TaskRecord[]) {
  const memberIds = [
    ...new Set(
      tasks.flatMap((t) => [t.assigneeId, t.createdById]).filter((v): v is string => Boolean(v)),
    ),
  ];
  const businessIds = [...new Set(tasks.map((t) => t.businessId).filter((v): v is string => Boolean(v)))];
  const pipelineIds = [...new Set(tasks.map((t) => t.pipelineId).filter((v): v is string => Boolean(v)))];

  const [members, businesses, pipelines] = await Promise.all([
    memberIds.length
      ? db.teamMember.findMany({ where: { id: { in: memberIds } }, select: { id: true, name: true } })
      : [],
    businessIds.length
      ? db.business.findMany({ where: { id: { in: businessIds } }, select: { id: true, name: true } })
      : [],
    pipelineIds.length
      ? db.pipeline.findMany({ where: { id: { in: pipelineIds } }, select: { id: true, code: true } })
      : [],
  ]);

  return {
    member: new Map(members.map((m) => [m.id, m.name])),
    business: new Map(businesses.map((b) => [b.id, b.name])),
    pipeline: new Map(pipelines.map((p) => [p.id, p.code])),
  };
}

function decorate<T extends TaskRecord>(
  task: T,
  maps: Awaited<ReturnType<typeof resolveLookups>>,
) {
  return {
    ...task,
    assigneeName: task.assigneeId ? (maps.member.get(task.assigneeId) ?? null) : null,
    createdByName: task.createdById ? (maps.member.get(task.createdById) ?? null) : null,
    businessName: task.businessId ? (maps.business.get(task.businessId) ?? null) : null,
    pipelineCode: task.pipelineId ? (maps.pipeline.get(task.pipelineId) ?? null) : null,
  };
}

export async function listTasks() {
  await requirePermission("task:read");
  const tasks = await db.task.findMany({ orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }] });
  const maps = await resolveLookups(tasks);
  return tasks.map((t) => decorate(t, maps));
}
export type TaskItem = Awaited<ReturnType<typeof listTasks>>[number];

export async function getTaskById(id: string) {
  await requirePermission("task:read");
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return null;
  const maps = await resolveLookups([task]);
  return decorate(task, maps);
}
export type TaskDetailItem = NonNullable<Awaited<ReturnType<typeof getTaskById>>>;

/** Tasks scoped to a pipeline (for the phase shell). Gated with the pipeline scope. */
export async function listTasksForPipeline(pipelineId: string) {
  await requirePermission("pipeline:read");
  const tasks = await db.task.findMany({
    where: { pipelineId },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });
  const maps = await resolveLookups(tasks);
  return tasks.map((t) => decorate(t, maps));
}

/** Option lists for the task form (assignee / business / pipeline links). */
export async function listTaskOptions() {
  await requirePermission("task:read");
  const [members, businesses, pipelines] = await Promise.all([
    db.teamMember.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.business.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.pipeline.findMany({
      select: { id: true, code: true, business: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    members,
    businesses,
    pipelines: pipelines.map((p) => ({ id: p.id, label: `${p.code} · ${p.business.name}` })),
  };
}
export type TaskOptions = Awaited<ReturnType<typeof listTaskOptions>>;
