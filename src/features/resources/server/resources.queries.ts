import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { businessNameMap, pipelineCodeMap } from "@/lib/lookups";

type ScopedRecord = { businessId: string | null; pipelineId: string | null };

async function resolveScopes(items: ScopedRecord[]) {
  const [business, pipeline] = await Promise.all([
    businessNameMap(items.map((i) => i.businessId)),
    pipelineCodeMap(items.map((i) => i.pipelineId)),
  ]);
  return { business, pipeline };
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

/** Resources scoped to a business (detail tab). */
export async function listResourcesForBusiness(businessId: string) {
  await requirePermission("resource:read");
  const items = await db.resource.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  const maps = await resolveScopes(items);
  return items.map((r) => decorate(r, maps));
}

/** Single resource for the fullscreen viewer. */
export async function getResourceById(id: string) {
  await requirePermission("resource:read");
  const item = await db.resource.findUnique({ where: { id } });
  if (!item) return null;
  const maps = await resolveScopes([item]);
  return decorate(item, maps);
}
