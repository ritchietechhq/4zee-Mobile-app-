// ============================================================
// Notification Store — Zustand (shared across all screens)
// Provides a single source of truth for unread notification count
// ============================================================

import { create } from 'zustand';
import { notificationService } from '@/services/notification.service';

interface NotificationState {
  unreadCount: number;
  isLoading: boolean;

  /** Fetch the unread count from the server */
  fetchUnreadCount: () => Promise<void>;

  /** Optimistically decrement by 1 (when marking a single as read) */
  decrementUnread: () => void;

  /** Set count to 0 (when marking all as read) */
  clearUnread: () => void;

  /** Set an exact value (e.g. from dashboard payload) */
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Silently fail
    }
  },

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  clearUnread: () => set({ unreadCount: 0 }),

  setUnreadCount: (count: number) => set({ unreadCount: count }),
}));
