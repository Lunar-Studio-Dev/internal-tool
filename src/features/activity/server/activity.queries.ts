import "server-only";

import { requireMember } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { memberNameMap } from "@/lib/lookups";
import { format, startOfDay } from "date-fns";

export type ActivityTimelineItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  businessId: string | null;
  pipelineId: string | null;
  createdAt: Date;
  actorName: string | null;
  metadata: unknown;
};

export type ActivityTimelineDay = {
  day: string;
  label: string;
  items: ActivityTimelineItem[];
};

export async function listActivityTimeline(opts: {
  cursor?: string;
  limit?: number;
  businessId?: string;
  pipelineId?: string;
  actorId?: string;
}) {
  await requireMember();
  const limit = opts.limit ?? 30;

  const logs = await db.activityLog.findMany({
    where: {
      ...(opts.businessId ? { businessId: opts.businessId } : {}),
      ...(opts.pipelineId ? { pipelineId: opts.pipelineId } : {}),
      ...(opts.actorId ? { actorId: opts.actorId } : {}),
      ...(opts.cursor ? { createdAt: { lt: new Date(opts.cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = logs.length > limit;
  const page = hasMore ? logs.slice(0, limit) : logs;
  const names = await memberNameMap(page.map((l) => l.actorId));

  const items: ActivityTimelineItem[] = page.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    businessId: l.businessId,
    pipelineId: l.pipelineId,
    createdAt: l.createdAt,
    actorName: l.actorId ? (names.get(l.actorId) ?? null) : null,
    metadata: l.metadata,
  }));

  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() : null;

  return { items, nextCursor, hasMore };
}

/** Group flat items by calendar day for timeline UI. */
export function groupActivityByDay(items: ActivityTimelineItem[]): ActivityTimelineDay[] {
  const map = new Map<string, ActivityTimelineItem[]>();
  for (const item of items) {
    const day = startOfDay(item.createdAt).toISOString();
    const list = map.get(day) ?? [];
    list.push(item);
    map.set(day, list);
  }
  return [...map.entries()].map(([day, dayItems]) => ({
    day,
    label: format(new Date(day), "EEEE, d MMM yyyy"),
    items: dayItems,
  }));
}

export async function getActivityTimelinePage(opts: Parameters<typeof listActivityTimeline>[0]) {
  const { items, nextCursor, hasMore } = await listActivityTimeline(opts);
  return {
    days: groupActivityByDay(items),
    nextCursor,
    hasMore,
  };
}
