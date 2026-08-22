import "server-only";

import {
  earningsVsExpensesByMonth,
  financeSummary,
  revenueByMonth,
} from "@/features/accounts/server/accounts.queries";
import { PHASE_LABELS, PHASE_ORDER } from "@/features/pipelines/constants";
import {
  PhaseType,
  PipelineStatus,
  TaskStatus,
} from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export type DateRange = { from?: Date; to?: Date };

function inRange(field: "createdAt" | "date", range?: DateRange) {
  if (!range?.from && !range?.to) return {};
  return {
    [field]: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}

export async function getAnalyticsOverview(range?: DateRange) {
  await requirePermission("analytics:read");
  const createdFilter = inRange("createdAt", range);

  const [total, active, completed, deactivated, newLeads] = await Promise.all([
    db.pipeline.count({ where: createdFilter }),
    db.pipeline.count({ where: { ...createdFilter, status: PipelineStatus.ACTIVE } }),
    db.pipeline.count({ where: { ...createdFilter, status: PipelineStatus.COMPLETED } }),
    db.pipeline.count({ where: { ...createdFilter, status: PipelineStatus.DEACTIVATED } }),
    db.pipeline.count({
      where: {
        ...createdFilter,
        currentPhase: PhaseType.DISCOVERY,
        status: PipelineStatus.ACTIVE,
      },
    }),
  ]);

  return { total, active, completed, deactivated, newLeads };
}

export async function getPhaseDistribution() {
  await requirePermission("analytics:read");
  const groups = await db.pipeline.groupBy({
    by: ["currentPhase"],
    _count: { _all: true },
  });
  const map = new Map(groups.map((g) => [g.currentPhase, g._count._all]));
  return PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABELS[phase],
    count: map.get(phase) ?? 0,
  }));
}

export async function getConversionByPhase() {
  await requirePermission("analytics:read");
  const total = await db.pipeline.count();
  if (total === 0) {
    return PHASE_ORDER.map((phase) => ({
      phase,
      label: PHASE_LABELS[phase],
      reached: 0,
      rate: 0,
    }));
  }

  const results = await Promise.all(
    PHASE_ORDER.map(async (phase) => {
      const reached = await db.pipelinePhase.count({
        where: { type: phase, status: { in: ["ACTIVE", "PROMOTED"] } },
      });
      return {
        phase,
        label: PHASE_LABELS[phase],
        reached,
        rate: Math.round((reached / total) * 100),
      };
    }),
  );
  return results;
}

export async function getAvgTimeInPhase() {
  await requirePermission("analytics:read");
  const promoted = await db.pipelinePhase.findMany({
    where: { promotedAt: { not: null } },
    select: { type: true, startedAt: true, promotedAt: true },
  });

  const sums = new Map<PhaseType, { totalDays: number; count: number }>();
  for (const row of promoted) {
    if (!row.startedAt || !row.promotedAt) continue;
    const days = (row.promotedAt.getTime() - row.startedAt.getTime()) / (1000 * 60 * 60 * 24);
    const prev = sums.get(row.type) ?? { totalDays: 0, count: 0 };
    sums.set(row.type, { totalDays: prev.totalDays + days, count: prev.count + 1 });
  }

  return PHASE_ORDER.filter((p) => p !== PhaseType.CONTACT_INFO).map((phase) => {
    const s = sums.get(phase);
    return {
      phase,
      label: PHASE_LABELS[phase],
      avgDays: s && s.count > 0 ? Math.round(s.totalDays / s.count) : 0,
    };
  });
}

export async function getDeactivationAnalytics() {
  await requirePermission("analytics:read");
  const reasons = await db.deactivationReason.findMany({ orderBy: { usageCount: "desc" } });
  return reasons.map((r) => ({
    id: r.id,
    label: r.label,
    enabled: r.enabled,
    usageCount: r.usageCount,
  }));
}

export async function getPipelineValueAnalytics() {
  await requirePermission("analytics:read");
  const groups = await db.pipeline.groupBy({
    by: ["currentPhase"],
    _count: { _all: true },
    where: { status: PipelineStatus.ACTIVE },
  });
  return groups.map((g) => ({
    phase: g.currentPhase,
    label: PHASE_LABELS[g.currentPhase],
    count: g._count._all,
  }));
}

export async function getTeamWorkloadAnalytics() {
  await requirePermission("analytics:read");
  const members = await db.teamMember.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const now = new Date();

  const rows = await Promise.all(
    members.map(async (m) => {
      const [activeTasks, overdue, pipelines, followUps] = await Promise.all([
        db.task.count({
          where: {
            assigneeId: m.id,
            status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
          },
        }),
        db.task.count({
          where: {
            assigneeId: m.id,
            status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
            dueAt: { lt: now },
          },
        }),
        db.pipeline.count({ where: { ownerId: m.id, status: PipelineStatus.ACTIVE } }),
        db.followUp.count({
          where: { assigneeId: m.id, completedAt: null },
        }),
      ]);
      return { id: m.id, name: m.name, activeTasks, overdue, pipelines, followUps };
    }),
  );
  return rows;
}

export async function getMonthlyPipelineTrend(months = 6) {
  await requirePermission("analytics:read");
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const pipelines = await db.pipeline.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, status: true },
  });

  const buckets = new Map<string, { active: number; completed: number; deactivated: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { active: 0, completed: 0, deactivated: 0 });
  }

  for (const p of pipelines) {
    const d = p.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (p.status === PipelineStatus.ACTIVE) bucket.active++;
    else if (p.status === PipelineStatus.COMPLETED) bucket.completed++;
    else bucket.deactivated++;
  }

  return [...buckets.entries()].map(([month, counts]) => ({
    month,
    label: new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    ...counts,
  }));
}

export async function getFinancialAnalytics(period: "monthly" | "quarterly" | "yearly" = "monthly") {
  await requirePermission("analytics:read");
  const [summary, revenue, comparison] = await Promise.all([
    financeSummary(),
    revenueByMonth(),
    earningsVsExpensesByMonth(),
  ]);

  if (period === "monthly") {
    return { summary, revenue, comparison, period };
  }

  const bucketKey = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    if (period === "yearly") return String(y);
    const q = Math.ceil(m / 3);
    return `${y}-Q${q}`;
  };

  const aggregate = <T extends { month: string; amountPaise?: number; earningPaise?: number; expensePaise?: number }>(
    items: T[],
    fields: ("amountPaise" | "earningPaise" | "expensePaise")[],
  ) => {
    const map = new Map<string, Record<string, number>>();
    for (const item of items) {
      const key = bucketKey(item.month);
      const row = map.get(key) ?? {};
      for (const f of fields) {
        row[f] = (row[f] ?? 0) + (item[f] ?? 0);
      }
      map.set(key, row);
    }
    return [...map.entries()].map(([key, vals]) => ({
      month: key,
      label: key,
      ...vals,
    }));
  };

  return {
    summary,
    revenue: aggregate(revenue, ["amountPaise"]),
    comparison: aggregate(comparison, ["earningPaise", "expensePaise"]),
    period,
  };
}

export async function getAnalyticsBundle(tab: string, period?: "monthly" | "quarterly" | "yearly") {
  switch (tab) {
    case "pipeline":
      return {
        phaseDistribution: await getPhaseDistribution(),
        conversion: await getConversionByPhase(),
        avgTime: await getAvgTimeInPhase(),
        deactivations: await getDeactivationAnalytics(),
        trend: await getMonthlyPipelineTrend(),
        pipelineValue: await getPipelineValueAnalytics(),
      };
    case "financial":
      return getFinancialAnalytics(period ?? "monthly");
    case "team":
      return { workload: await getTeamWorkloadAnalytics() };
    default:
      return {
        overview: await getAnalyticsOverview(),
        phaseDistribution: await getPhaseDistribution(),
        trend: await getMonthlyPipelineTrend(),
      };
  }
}
