import "server-only";

import { TaskStatus } from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { businessNameMap, memberNameMap, pipelineCodeMap } from "@/lib/lookups";

/** Admin-gated. Lists all members (including INACTIVE) with their roles. */
export async function listMembers() {
  await requirePermission("team:manage");
  return db.teamMember.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}
export type MemberListItem = Awaited<ReturnType<typeof listMembers>>[number];

/** Admin-gated. Single member detail with roles. */
export async function getMemberById(id: string) {
  await requirePermission("team:manage");
  return db.teamMember.findUnique({ where: { id } });
}
export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMemberById>>>;

export type MemberWorkload = {
  counts: {
    activeTasks: number;
    overdue: number;
    pipelines: number;
    followUps: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: Date | null;
    businessName: string | null;
    pipelineCode: string | null;
  }>;
  pipelines: Array<{
    id: string;
    code: string;
    name: string;
    currentPhase: string;
    status: string;
    businessName: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    createdAt: Date;
    actorName: string | null;
  }>;
};

export async function getMemberWorkload(id: string): Promise<MemberWorkload> {
  await requirePermission("team:manage");
  const now = new Date();

  const [activeTasks, overdue, pipelineCount, followUps, tasks, pipelines, logs] =
    await Promise.all([
      db.task.count({
        where: { assigneeId: id, status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } },
      }),
      db.task.count({
        where: {
          assigneeId: id,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          dueAt: { lt: now },
        },
      }),
      db.pipeline.count({ where: { assignees: { some: { memberId: id } } } }),
      db.followUp.count({ where: { assigneeId: id, completedAt: null } }),
      db.task.findMany({
        where: { assigneeId: id },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 50,
      }),
      db.pipeline.findMany({
        where: { assignees: { some: { memberId: id } } },
        include: { business: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.activityLog.findMany({
        where: { actorId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  const [businessNames, pipelineCodes, actor] = await Promise.all([
    businessNameMap(tasks.map((t) => t.businessId)),
    pipelineCodeMap(tasks.map((t) => t.pipelineId)),
    memberNameMap(logs.map((l) => l.actorId)),
  ]);

  return {
    counts: {
      activeTasks,
      overdue,
      pipelines: pipelineCount,
      followUps,
    },
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueAt: t.dueAt,
      businessName: t.businessId ? (businessNames.get(t.businessId) ?? null) : null,
      pipelineCode: t.pipelineId ? (pipelineCodes.get(t.pipelineId) ?? null) : null,
    })),
    pipelines: pipelines.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      currentPhase: p.currentPhase,
      status: p.status,
      businessName: p.business.name,
    })),
    activity: logs.map((l) => ({
      id: l.id,
      action: l.action,
      createdAt: l.createdAt,
      actorName: l.actorId ? (actor.get(l.actorId) ?? null) : null,
    })),
  };
}
