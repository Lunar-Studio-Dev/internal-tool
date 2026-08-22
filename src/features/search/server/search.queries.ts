import "server-only";

import { requireMember } from "@/lib/auth/member";
import { db } from "@/lib/db";

export type SearchResultItem = {
  id: string;
  type: "business" | "pipeline" | "resource" | "task";
  title: string;
  subtitle: string | null;
  href: string;
};

export async function globalSearch(query: string, limit = 20): Promise<SearchResultItem[]> {
  await requireMember();
  const q = query.trim();
  if (q.length < 2) return [];

  const perType = Math.ceil(limit / 4);
  const contains = { contains: q, mode: "insensitive" as const };

  const [businesses, pipelines, resources, tasks] = await Promise.all([
    db.business.findMany({
      where: { OR: [{ name: contains }, { email: contains }] },
      take: perType,
      select: { id: true, name: true, industry: true },
      orderBy: { name: "asc" },
    }),
    db.pipeline.findMany({
      where: {
        OR: [{ code: contains }, { name: contains }, { business: { name: contains } }],
      },
      take: perType,
      select: { id: true, code: true, name: true, business: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.resource.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      take: perType,
      select: { id: true, name: true, type: true },
      orderBy: { createdAt: "desc" },
    }),
    db.task.findMany({
      where: { title: contains },
      take: perType,
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const results: SearchResultItem[] = [
    ...businesses.map((b) => ({
      id: b.id,
      type: "business" as const,
      title: b.name,
      subtitle: b.industry,
      href: `/businesses/${b.id}`,
    })),
    ...pipelines.map((p) => ({
      id: p.id,
      type: "pipeline" as const,
      title: p.code,
      subtitle: `${p.name} · ${p.business.name}`,
      href: `/pipelines/${p.id}`,
    })),
    ...resources.map((r) => ({
      id: r.id,
      type: "resource" as const,
      title: r.name,
      subtitle: r.type,
      href: `/resources/${r.id}`,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      subtitle: t.status,
      href: `/todos?task=${t.id}`,
    })),
  ];

  return results.slice(0, limit);
}
