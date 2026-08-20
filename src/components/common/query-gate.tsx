import type { ReactNode } from "react";
import { AlertCircleIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function QueryGate({
  isPending,
  isError,
  error,
  skeleton,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  /** Component-shaped placeholder shown while loading. Falls back to a generic block. */
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  if (isPending) {
    return <>{skeleton ?? <DefaultQuerySkeleton />}</>;
  }
  if (isError) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Could not load"
        description={error?.message ?? "Something went wrong. Try again."}
      />
    );
  }
  return children;
}

/** Progressive section: show skeleton / error / content independently of sibling queries. */
export function QuerySection({
  isPending,
  isError,
  error,
  skeleton,
  children,
  errorTitle = "Could not load this section",
}: {
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
  skeleton: ReactNode;
  children: ReactNode;
  errorTitle?: string;
}) {
  if (isPending) return <>{skeleton}</>;
  if (isError) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title={errorTitle}
        description={error?.message ?? "Something went wrong. Try again."}
        className="p-6"
      />
    );
  }
  return children;
}

function DefaultQuerySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
