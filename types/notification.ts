// ============================================================
// Notification Types
// Matches: GET /notifications, PATCH /notifications/:id/read, etc.
// ============================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  applicationUpdates: boolean;
  paymentAlerts: boolean;
  promotionalEmails: boolean;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  appVersion?: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  deviceName?: string;
  appVersion?: string;
  isActive: boolean;
  lastActiveAt?: string;
  createdAt: string;
}
