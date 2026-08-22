"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { NotificationDto } from "@/features/notifications/api";
import {
  notificationQueries,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/notifications/api";

export function NotificationsBell() {
  const query = useQuery(notificationQueries.list());
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = query.data?.unreadCount ?? 0;
  const items = query.data?.items ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9">
          <BellIcon className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <CheckCheckIcon className="size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((n: NotificationDto) => (
                <li
                  key={n.id}
                  className={`border-b px-3 py-2 text-sm last:border-0 ${n.readAt ? "opacity-60" : "bg-muted/30"}`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      if (!n.readAt) markRead.mutate(n.id);
                    }}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.body ? (
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-3 py-2">
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link href="/activity">View activity</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
