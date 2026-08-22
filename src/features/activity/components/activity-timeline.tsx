"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { QueryGate } from "@/components/common/query-gate";
import { Button } from "@/components/ui/button";
import { activityQueries } from "@/features/activity/api";
import type { ActivityTimelineDto } from "@/features/activity/api";
import { activityLabel } from "@/lib/activity-labels";

export function ActivityTimeline({
  businessId,
  pipelineId,
  actorId,
}: {
  businessId?: string;
  pipelineId?: string;
  actorId?: string;
}) {
  const [cursor, setCursor] = useState<string | undefined>();
  const [accumulated, setAccumulated] = useState<ActivityTimelineDto["days"]>([]);

  const query = useQuery(
    activityQueries.timeline({ cursor, businessId, pipelineId, actorId }),
  );

  useEffect(() => {
    if (!query.data) return;
    setAccumulated((prev) => {
      if (!cursor) return query.data.days;
      const merged = [...prev];
      for (const day of query.data.days) {
        const existing = merged.find((d) => d.day === day.day);
        if (existing) {
          const ids = new Set(existing.items.map((i) => i.id));
          existing.items.push(...day.items.filter((i: { id: string }) => !ids.has(i.id)));
        } else {
          merged.push(day);
        }
      }
      return merged;
    });
  }, [query.data, cursor]);

  const days = accumulated;

  return (
    <QueryGate isPending={query.isPending && days.length === 0} isError={query.isError} error={query.error}>
      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <section key={day.day}>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {day.label}
              </h3>
              <ol className="flex flex-col gap-3 border-l pl-4">
                {day.items.map((item) => (
                  <li key={item.id} className="relative text-sm">
                    <span className="absolute -left-[1.35rem] top-1.5 size-2 rounded-full bg-border" />
                    <p>
                      <span className="font-medium">{item.actorName ?? "Someone"}</span>{" "}
                      {activityLabel(item.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      {item.pipelineId ? (
                        <>
                          {" · "}
                          <Link href={`/pipelines/${item.pipelineId}`} className="underline-offset-2 hover:underline">
                            Pipeline
                          </Link>
                        </>
                      ) : null}
                      {item.businessId ? (
                        <>
                          {" · "}
                          <Link href={`/businesses/${item.businessId}`} className="underline-offset-2 hover:underline">
                            Business
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {query.data?.hasMore ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(query.data?.nextCursor ?? undefined)}
              disabled={query.isFetching}
            >
              Load more
            </Button>
          ) : null}
        </div>
      )}
    </QueryGate>
  );
}
