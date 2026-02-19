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

/** The paginated notifications response uses standard API pagination */
export interface NotificationsResponse {
  items: Notification[];
  meta?: {
    pagination?: {
      nextCursor?: string;
      hasNext?: boolean;
      limit?: number;
    };
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  saleNotifications: boolean;
  commissionNotifications: boolean;
  applicationNotifications: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  pushToken: string;
  deviceType: 'ios' | 'android' | 'web';
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
