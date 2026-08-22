"use server";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/server/notifications.queries";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(id: string) {
  await markNotificationRead(id);
  revalidatePath("/");
}

export async function markAllNotificationsReadAction() {
  await markAllNotificationsRead();
  revalidatePath("/");
}
