import "server-only";

import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export async function listAllDeactivationReasons() {
  await requirePermission("settings:manage");
  return db.deactivationReason.findMany({ orderBy: [{ enabled: "desc" }, { label: "asc" }] });
}

export type DeactivationReasonAdmin = Awaited<ReturnType<typeof listAllDeactivationReasons>>[number];
