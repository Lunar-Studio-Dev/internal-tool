import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";

export function QueryGate({
  isPending,
  isError,
  error,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  children: ReactNode;
}) {
  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (isError) {
    return (
      <EmptyState
        title="Could not load"
        description={error?.message ?? "Something went wrong. Try again."}
      />
    );
  }
  return children;
}
