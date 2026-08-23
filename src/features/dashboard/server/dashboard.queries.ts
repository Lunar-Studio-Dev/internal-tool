import "server-only";

import { financeSummary } from "@/features/accounts/server/accounts.queries";
import { bucketOfTask } from "@/features/tasks/constants";
import { PHASE_ORDER, PHASE_LABELS } from "@/features/pipelines/constants";
import {
  ClientDecision,
  PhaseType,
  PipelineStatus,
  ProjectStatus,
  QuotationVersionStatus,
  TaskStatus,
} from "@/generated/prisma/enums";
import { requireMember, requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";

export type DashboardKpis = {
  businesses: number;
  activePipelines: number;
  activeProjects: number;
  pipelineValuePaise: number;
  revenuePaise: number;
};

export type FunnelItem = { phase: PhaseType; label: string; count: number };

export type StatusItem = { status: PipelineStatus; label: string; count: number };

export async function getDashboardKpis(): Promise<DashboardKpis> {
  await requireMember();
  const [businesses, activePipelines, activeProjects, finance, pipelineValuePaise] =
    await Promise.all([
      db.business.count(),
      db.pipeline.count({ where: { status: PipelineStatus.ACTIVE } }),
      db.project.count({ where: { status: ProjectStatus.ACTIVE } }),
      financeSummary().catch(() => ({
        earningPaise: 0,
        expensePaise: 0,
        netPaise: 0,
        outstandingPaise: 0,
      })),
      computePipelineValuePaise(),
    ]);

  return {
    businesses,
    activePipelines,
    activeProjects,
    pipelineValuePaise,
    revenuePaise: finance.earningPaise,
  };
}

async function computePipelineValuePaise(): Promise<number> {
  const pipelines = await db.pipeline.findMany({
    where: {
      status: PipelineStatus.ACTIVE,
      decision: { decision: ClientDecision.ACCEPTED },
    },
    select: {
      quotations: {
        where: { status: QuotationVersionStatus.CURRENT },
        select: { subtotal: true },
        take: 1,
      },
    },
  });

  return pipelines.reduce((sum, p) => sum + (p.quotations[0]?.subtotal ?? 0), 0);
}

export async function getPipelineFunnel(): Promise<FunnelItem[]> {
  await requireMember();
  const groups = await db.pipeline.groupBy({
    by: ["currentPhase"],
    _count: { _all: true },
    where: { status: { not: PipelineStatus.COMPLETED } },
  });
  const countMap = new Map(groups.map((g) => [g.currentPhase, g._count._all]));

  return PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABELS[phase],
    count: countMap.get(phase) ?? 0,
  }));
}

export async function getPipelineStatusBreakdown(): Promise<StatusItem[]> {
  await requireMember();
  const groups = await db.pipeline.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const labels: Record<PipelineStatus, string> = {
    ACTIVE: "Active",
    DEACTIVATED: "Deactivated",
    COMPLETED: "Completed",
  };
  return groups.map((g) => ({
    status: g.status,
    label: labels[g.status],
    count: g._count._all,
  }));
}

export async function getRecentPipelines(limit = 5) {
  await requirePermission("pipeline:read");
  const pipelines = await db.pipeline.findMany({
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: { business: { select: { id: true, name: true } } },
  });
  const assigneeRows = await db.pipelineAssignee.findMany({
    where: { pipelineId: { in: pipelines.map((p) => p.id) } },
    orderBy: { assignedAt: "asc" },
  });
  const memberIds = [...new Set(assigneeRows.map((r) => r.memberId))];
  const names = await memberNameMap(memberIds);
  const assigneesByPipeline = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assigneesByPipeline.get(row.pipelineId) ?? [];
    list.push(names.get(row.memberId) ?? "Unknown");
    assigneesByPipeline.set(row.pipelineId, list);
  }
  return pipelines.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    status: p.status,
    currentPhase: p.currentPhase,
    businessId: p.business.id,
    businessName: p.business.name,
    assigneeNames: assigneesByPipeline.get(p.id) ?? [],
    updatedAt: p.updatedAt,
  }));
}

export async function getMyOpenTasks(limit = 8) {
  const member = await requirePermission("task:read");
  const tasks = await db.task.findMany({
    where: {
      assigneeId: member.id,
      status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  const [business, pipeline] = await Promise.all([
    db.business.findMany({
      where: { id: { in: tasks.map((t) => t.businessId).filter(Boolean) as string[] } },
      select: { id: true, name: true },
    }),
    db.pipeline.findMany({
      where: { id: { in: tasks.map((t) => t.pipelineId).filter(Boolean) as string[] } },
      select: { id: true, code: true },
    }),
  ]);
  const businessMap = new Map(business.map((b) => [b.id, b.name]));
  const pipelineMap = new Map(pipeline.map((p) => [p.id, p.code]));

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt,
    bucket: bucketOfTask({ status: t.status, dueAt: t.dueAt?.toISOString() ?? null }),
    businessId: t.businessId,
    businessName: t.businessId ? (businessMap.get(t.businessId) ?? null) : null,
    pipelineId: t.pipelineId,
    pipelineCode: t.pipelineId ? (pipelineMap.get(t.pipelineId) ?? null) : null,
  }));
}

export async function getUpcomingFollowUps(limit = 5) {
  const member = await requireMember();
  const now = new Date();
  const items = await db.followUp.findMany({
    where: {
      completedAt: null,
      dueAt: { gte: now },
      OR: [{ assigneeId: member.id }, { assigneeId: null }],
    },
    orderBy: { dueAt: "asc" },
    take: limit,
  });

  const [pipelines, businesses, names] = await Promise.all([
    db.pipeline.findMany({
      where: { id: { in: items.map((f) => f.pipelineId).filter(Boolean) as string[] } },
      select: { id: true, code: true },
    }),
    db.business.findMany({
      where: { id: { in: items.map((f) => f.businessId).filter(Boolean) as string[] } },
      select: { id: true, name: true },
    }),
    memberNameMap(items.map((f) => f.assigneeId)),
  ]);
  const pipelineMap = new Map(pipelines.map((p) => [p.id, p.code]));
  const businessMap = new Map(businesses.map((b) => [b.id, b.name]));

  return items.map((f) => ({
    id: f.id,
    title: f.reason,
    dueAt: f.dueAt,
    assigneeName: f.assigneeId ? (names.get(f.assigneeId) ?? null) : null,
    pipelineId: f.pipelineId,
    pipelineCode: f.pipelineId ? (pipelineMap.get(f.pipelineId) ?? null) : null,
    businessId: f.businessId,
    businessName: f.businessId ? (businessMap.get(f.businessId) ?? null) : null,
  }));
}

export async function getDashboardData() {
  const member = await requireMember();
  const [kpis, funnel, statusBreakdown, recentPipelines, myTasks, followUps] =
    await Promise.all([
      getDashboardKpis(),
      getPipelineFunnel(),
      getPipelineStatusBreakdown(),
      getRecentPipelines(),
      getMyOpenTasks(),
      getUpcomingFollowUps(),
    ]);
  return { memberId: member.id, kpis, funnel, statusBreakdown, recentPipelines, myTasks, followUps };
}
