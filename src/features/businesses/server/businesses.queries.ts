import "server-only";

import { ClientDecision, PipelineStatus, QuotationVersionStatus } from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";

/**
 * Businesses with their primary contact and contact count. Pipeline counts are
 * added in PHASE_5; pages render 0 until then.
 */
export async function listBusinesses() {
  await requirePermission("business:read");
  return db.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      pipelines: { select: { status: true } },
      _count: { select: { contacts: true } },
    },
  });
}
export type BusinessListItem = Awaited<ReturnType<typeof listBusinesses>>[number];

/** Full business detail with all contacts (primary first). */
export async function getBusinessById(id: string) {
  await requirePermission("business:read");
  return db.business.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      pipelines: {
        select: { id: true, code: true, name: true, currentPhase: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
export type BusinessDetail = NonNullable<Awaited<ReturnType<typeof getBusinessById>>>;

/** Pipelines for the business detail tab — richer than the summary on getBusinessById. */
export async function listPipelinesForBusiness(businessId: string) {
  await requirePermission("pipeline:read");

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) return [];

  const pipelines = await db.pipeline.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      currentPhase: true,
      status: true,
      ownerId: true,
      createdAt: true,
      deactivatedAt: true,
      decision: { select: { decision: true } },
      project: { select: { id: true } },
      quotations: {
        where: { status: QuotationVersionStatus.CURRENT },
        select: { subtotal: true },
        take: 1,
      },
    },
  });

  const names = await memberNameMap(pipelines.map((p) => p.ownerId));

  return pipelines.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    currentPhase: p.currentPhase,
    status: p.status,
    ownerName: p.ownerId ? (names.get(p.ownerId) ?? null) : null,
    createdAt: p.createdAt,
    deactivatedAt: p.deactivatedAt,
    decision: p.decision?.decision ?? null,
    handedOff: Boolean(p.project),
    quotationSubtotal: p.quotations[0]?.subtotal ?? null,
  }));
}
export type BusinessPipelineItem = Awaited<
  ReturnType<typeof listPipelinesForBusiness>
>[number];

export type BusinessActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  metadata: unknown;
  actorName: string | null;
};

/**
 * Scoped audit timeline for a business, with actor names resolved (actorId is
 * denormalized with no FK, so we join in a second query).
 */
export async function getBusinessActivity(
  businessId: string,
  limit = 50,
): Promise<BusinessActivityItem[]> {
  await requirePermission("business:read");
  const logs = await db.activityLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const actorName = await memberNameMap(logs.map((l) => l.actorId));

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    createdAt: l.createdAt,
    metadata: l.metadata,
    actorName: l.actorId ? (actorName.get(l.actorId) ?? null) : null,
  }));
}

export type BusinessFinancialSummary = {
  totalPaise: number;
  projectCount: number;
};

/**
 * Revenue from recorded earnings (PHASE_8). Falls back to accepted/completed
 * quotation subtotals when no ledger rows exist yet.
 */
export async function getBusinessFinancialSummary(
  businessId: string,
): Promise<BusinessFinancialSummary> {
  await requirePermission("business:read");

  const [earnings, projectCount, pipelines] = await Promise.all([
    db.transaction.aggregate({
      where: { businessId, type: "EARNING" },
      _sum: { amount: true },
    }),
    db.project.count({ where: { businessId } }),
    db.pipeline.findMany({
      where: { businessId },
      select: {
        status: true,
        decision: { select: { decision: true } },
        quotations: {
          where: { status: QuotationVersionStatus.CURRENT },
          select: { subtotal: true },
          take: 1,
        },
      },
    }),
  ]);

  const earnedPaise = earnings._sum.amount ?? 0;
  if (earnedPaise > 0 || projectCount > 0) {
    return {
      totalPaise: earnedPaise,
      projectCount,
    };
  }

  const successful = pipelines.filter(
    (p) =>
      p.status === PipelineStatus.COMPLETED || p.decision?.decision === ClientDecision.ACCEPTED,
  );

  return {
    totalPaise: successful.reduce((sum, p) => sum + (p.quotations[0]?.subtotal ?? 0), 0),
    projectCount: successful.length,
  };
}
