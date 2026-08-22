import "server-only";

import { getAppSettings } from "@/lib/app-settings";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";

export async function getSettings() {
  await requirePermission("settings:manage");
  const [settings, phases] = await Promise.all([
    getAppSettings(),
    Promise.resolve(null),
  ]);
  return { settings };
}

export async function listAllDeactivationReasons() {
  await requirePermission("settings:manage");
  return db.deactivationReason.findMany({ orderBy: [{ enabled: "desc" }, { label: "asc" }] });
}

export type DeactivationReasonAdmin = Awaited<ReturnType<typeof listAllDeactivationReasons>>[number];
