import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/server/notifications.actions";
import { api, type Jsonify } from "@/lib/api/client";
import { invalidateNotifications } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import type { Notification } from "@/generated/prisma/client";

export type NotificationDto = Jsonify<Notification>;

export type NotificationsResponse = {
  items: NotificationDto[];
  unreadCount: number;
};

export const notificationQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.notifications.list(),
      queryFn: ({ signal }) => api<NotificationsResponse>("/api/notifications", { signal }),
      refetchInterval: 60_000,
    }),
};

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationReadAction(id),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsReadAction(),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}
