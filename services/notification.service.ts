// ============================================================
// Notification Service
// Endpoints: GET /notifications, /notifications/unread-count,
//            PATCH /notifications/:id/read, /notifications/read-all,
//            POST /notifications/device, etc.
// ============================================================

import api from './api';
import type {
  NotificationsResponse,
  UnreadCountResponse,
  NotificationPreferences,
  RegisterDeviceRequest,
  DeviceInfo,
} from '@/types';

class NotificationService {
  /** GET /notifications — cursor-paginated */
  async getNotifications(
    unreadOnly = false,
    cursor?: string,
    limit = 20,
  ): Promise<NotificationsResponse> {
    const params: Record<string, unknown> = {
      unreadOnly: String(unreadOnly),
      limit,
    };
    if (cursor) params.cursor = cursor;
    const res = await api.get<NotificationsResponse>('/notifications', params);
    return res.data!;
  }

  /** GET /notifications/unread-count */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return res.data!.unreadCount;
  }

  /** PATCH /notifications/:id/read */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  }

  /** PATCH /notifications/read-all */
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  }

  /** DELETE /notifications/:id */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  }

  /** GET /notifications/preferences */
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get<NotificationPreferences>(
      '/notifications/preferences',
    );
    return res.data!;
  }

  /** PATCH /notifications/preferences */
  async updatePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<void> {
    await api.patch('/notifications/preferences', prefs);
  }

  /** POST /notifications/device */
  async registerDevice(payload: RegisterDeviceRequest): Promise<DeviceInfo> {
    const res = await api.post<DeviceInfo>('/notifications/device', payload);
    return res.data!;
  }

  /** PATCH /notifications/device/:deviceId */
  async updatePushToken(
    deviceId: string,
    pushToken: string,
  ): Promise<void> {
    await api.patch(`/notifications/device/${deviceId}`, { pushToken });
  }

  /** DELETE /notifications/device/:deviceId */
  async unregisterDevice(deviceId: string): Promise<void> {
    await api.delete(`/notifications/device/${deviceId}`);
  }

  /** GET /notifications/devices */
  async getDevices(): Promise<DeviceInfo[]> {
    const res = await api.get<DeviceInfo[]>('/notifications/devices');
    return res.data!;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
