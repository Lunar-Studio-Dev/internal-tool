import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Filter bar + bordered table placeholder for list pages. */
export function TablePageSkeleton({
  rows = 6,
  columns = 5,
  showFilters = true,
}: {
  rows?: number;
  columns?: number;
  showFilters?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {showFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 min-w-52 flex-1" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border">
        <div className="flex gap-4 border-b bg-muted/40 px-3 py-2.5">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        <div className="flex flex-col divide-y">
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="flex gap-4 px-3 py-3">
              {Array.from({ length: columns }).map((_, col) => (
                <Skeleton key={col} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-4 flex flex-col gap-2">
      <Skeleton className="h-3.5 w-40" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 2, stats = 4 }: { cards?: number; stats?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {Array.from({ length: stats }).map((_, j) => (
              <div key={j} className="rounded-md border px-3 py-2">
                <Skeleton className="mb-2 h-3 w-16" />
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y rounded-lg border px-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3 max-w-72" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function FormCardSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function DetailCardsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

export function PipelineDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
      <CardGridSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4 max-w-md" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function BusinessDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TaskDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, section) => (
          <div key={section} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <ListRowsSkeleton rows={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourceLibrarySkeleton() {
  return <TablePageSkeleton rows={8} columns={6} />;
}

export function ResourceDetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <Skeleton className="min-h-[calc(100dvh-12rem)] w-full flex-1 rounded-lg" />
    </div>
  );
}

export function BusinessGlanceSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-24" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="size-4 shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="mt-1 size-2 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4 max-w-md" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
