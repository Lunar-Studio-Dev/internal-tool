import "server-only";

import { db } from "@/lib/db";

/** Human-readable project code, e.g. 42 → "PRJ-00042". */
export function formatProjectCode(n: number): string {
  return `PRJ-${String(n).padStart(5, "0")}`;
}

export async function nextProjectCode(): Promise<string> {
  const count = await db.project.count();
  return formatProjectCode(count + 1);
}

export async function nextProjectCodeInTx(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
): Promise<string> {
  const count = await tx.project.count();
  return formatProjectCode(count + 1);
}
