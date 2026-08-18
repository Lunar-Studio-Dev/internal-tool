import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

type ScopedRecord = { businessId: string | null; pipelineId: string | null };

async function resolveScopes(items: ScopedRecord[]) {
  const businessIds = [...new Set(items.map((i) => i.businessId).filter((v): v is string => Boolean(v)))];
  const pipelineIds = [...new Set(items.map((i) => i.pipelineId).filter((v): v is string => Boolean(v)))];
  const [businesses, pipelines] = await Promise.all([
    businessIds.length
      ? db.business.findMany({ where: { id: { in: businessIds } }, select: { id: true, name: true } })
      : [],
    pipelineIds.length
      ? db.pipeline.findMany({ where: { id: { in: pipelineIds } }, select: { id: true, code: true } })
      : [],
  ]);
  return {
    business: new Map(businesses.map((b) => [b.id, b.name])),
    pipeline: new Map(pipelines.map((p) => [p.id, p.code])),
  };
}

function decorate<T extends ScopedRecord>(item: T, maps: Awaited<ReturnType<typeof resolveScopes>>) {
  return {
    ...item,
    businessName: item.businessId ? (maps.business.get(item.businessId) ?? null) : null,
    pipelineCode: item.pipelineId ? (maps.pipeline.get(item.pipelineId) ?? null) : null,
  };
}

export async function listResources() {
  await requirePermission("resource:read");
  const items = await db.resource.findMany({ orderBy: { createdAt: "desc" } });
  const maps = await resolveScopes(items);
  return items.map((r) => decorate(r, maps));
}
export type ResourceItem = Awaited<ReturnType<typeof listResources>>[number];

/** Resources scoped to a pipeline (for the phase shell). Gated with pipeline scope. */
export async function listResourcesForPipeline(pipelineId: string) {
  await requirePermission("pipeline:read");
  const items = await db.resource.findMany({ where: { pipelineId }, orderBy: { createdAt: "desc" } });
  const maps = await resolveScopes(items);
  return items.map((r) => decorate(r, maps));
}

/** Business/pipeline options for the upload form and library filters. */
export async function listResourceOptions() {
  await requirePermission("resource:read");
  const [businesses, pipelines] = await Promise.all([
    db.business.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.pipeline.findMany({
      select: { id: true, code: true, business: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    businesses,
    pipelines: pipelines.map((p) => ({ id: p.id, label: `${p.code} · ${p.business.name}` })),
  };
}
export type ResourceOptions = Awaited<ReturnType<typeof listResourceOptions>>;
