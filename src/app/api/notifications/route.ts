import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/features/notifications/server/notifications.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () =>
    jsonData({
      items: await listNotifications(),
      unreadCount: await getUnreadNotificationCount(),
    }),
  );
}
