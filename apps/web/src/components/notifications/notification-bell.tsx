'use client';

import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { AppNotification } from '@/types';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<{ notifications: AppNotification[]; unreadCount: number }>('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent — notification bell is non-critical
    }
  }, [user]);

  React.useEffect(() => {
    fetchNotifications();
    // Poll every 60s for new notifications while the app is open.
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-lg"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="mt-1 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn('rounded-lg px-2 py-2.5 text-sm', !n.isRead && 'bg-brand-50 dark:bg-brand-950/30')}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
