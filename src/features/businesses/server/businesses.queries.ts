import "server-only";

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
