import "server-only";

import { db } from "@/lib/db";

/** Human-readable pipeline code, e.g. 42 → "PL-00042". */
export function formatPipelineCode(n: number): string {
  return `PL-${String(n).padStart(5, "0")}`;
}

/**
 * Next sequential code from the current pipeline count. Pipelines are never
 * deleted, so the count is monotonic; concurrent creates that collide on the
 * unique `code` are handled by the caller retrying.
 */
export async function nextPipelineCode(): Promise<string> {
  const count = await db.pipeline.count();
  return formatPipelineCode(count + 1);
}
