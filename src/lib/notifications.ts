import "server-only";

import type { NotificationType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type CreateNotificationInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
};

/** Fire-and-forget in-app notification. Failures are logged, not thrown. */
export async function createNotification(input: CreateNotificationInput) {
  try {
    await db.notification.create({ data: input });
  } catch (error) {
    console.error("[createNotification]", error);
  }
}

/** Notify all active admins (e.g. payment recorded). */
export async function notifyAdmins(input: Omit<CreateNotificationInput, "recipientId">) {
  const admins = await db.teamMember.findMany({
    where: { status: "ACTIVE", roles: { has: "ADMIN" } },
    select: { id: true },
  });
  await Promise.all(admins.map((a) => createNotification({ ...input, recipientId: a.id })));
}
