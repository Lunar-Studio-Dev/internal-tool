import "server-only";

import { requireMember } from "@/lib/auth/member";
import { db } from "@/lib/db";

export async function listNotifications(limit = 30) {
  const member = await requireMember();
  return db.notification.findMany({
    where: { recipientId: member.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  const member = await requireMember();
  return db.notification.count({
    where: { recipientId: member.id, readAt: null },
  });
}

export async function markNotificationRead(id: string) {
  const member = await requireMember();
  await db.notification.updateMany({
    where: { id, recipientId: member.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead() {
  const member = await requireMember();
  await db.notification.updateMany({
    where: { recipientId: member.id, readAt: null },
    data: { readAt: new Date() },
  });
}
