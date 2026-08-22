"use server";

import { z } from "zod";

import { listAllDeactivationReasons } from "@/features/settings/server/settings.queries";
import { friendlyDbError } from "@/lib/db-errors";
import { requirePermission } from "@/lib/auth/member";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  companyName: z.string().min(1).max(120),
  currency: z.string().min(3).max(3),
  dateFormat: z.string().min(1).max(40),
  timezone: z.string().min(1).max(60),
  staleDays: z.coerce.number().int().min(1).max(365),
});

const reasonSchema = z.object({
  label: z.string().min(1).max(120),
});

export type SettingsActionResult = { ok: true } | { ok: false; error: string };

export async function updateSettingsAction(input: unknown): Promise<SettingsActionResult> {
  try {
    await requirePermission("settings:manage");
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid settings." };

    await db.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...parsed.data },
      update: parsed.data,
    });
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyDbError(error, "Could not save settings.") };
  }
}

export async function addDeactivationReasonAction(input: unknown): Promise<SettingsActionResult> {
  try {
    await requirePermission("settings:manage");
    const parsed = reasonSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Label is required." };

    await db.deactivationReason.create({ data: { label: parsed.data.label.trim() } });
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyDbError(error, "Could not add reason.") };
  }
}

export async function updateDeactivationReasonAction(
  id: string,
  input: unknown,
): Promise<SettingsActionResult> {
  try {
    await requirePermission("settings:manage");
    const parsed = reasonSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Label is required." };

    await db.deactivationReason.update({
      where: { id },
      data: { label: parsed.data.label.trim() },
    });
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyDbError(error, "Could not update reason.") };
  }
}

export async function setDeactivationReasonEnabledAction(
  id: string,
  enabled: boolean,
): Promise<SettingsActionResult> {
  try {
    await requirePermission("settings:manage");
    await db.deactivationReason.update({ where: { id }, data: { enabled } });
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyDbError(error, "Could not update reason.") };
  }
}

export async function getDeactivationReasonsAdminAction() {
  return listAllDeactivationReasons();
}
