// ============================================================
// Push Notification Service
// Handles: Expo push token registration, notification channels,
//          foreground/background handlers, deep-link navigation,
//          TTS voice alerts, and device registration with backend.
//
// NOTE: expo-notifications push functionality was removed from
// Expo Go in SDK 53+.  We lazy-import the module so the app
// still boots in Expo Go (push features simply become no-ops).
// ============================================================

import { Platform, AppState } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import api from './api';
import { ttsService } from './tts.service';
import type { RegisterDeviceRequest } from '@/types';

// Lazy-loaded reference — set in init()
let Notifications: typeof import('expo-notifications') | null = null;

// ─── Android Notification Channels ────────────────────────────
const KYC_CHANNEL_ID = 'kyc_notifications';

// ─── State ────────────────────────────────────────────────────
let _pushToken: string | null = null;
let _isInitialized = false;
let _isExpoGo = false;

/** Detect Expo Go (no custom native code) */
function checkIsExpoGo(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    !Constants.expoConfig?.extra?.eas?.projectId
  );
}

/** Load expo-notifications dynamically and set up foreground handler */
async function loadNotificationsModule(): Promise<boolean> {
  try {
    Notifications = await import('expo-notifications');

    // Foreground presentation config
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data ?? {};

        if (data.ttsMessage && typeof data.ttsMessage === 'string') {
          ttsService.speak(data.ttsMessage);
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    return true;
  } catch (err) {
    console.warn('[Push] expo-notifications not available:', err);
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────

class PushService {
  /**
   * Initialise push notifications.
   * Call once after the user is authenticated.
   *
   * 1. Creates the Android notification channel
   * 2. Requests permission
   * 3. Gets the Expo push token
   * 4. Registers the device with the backend
   * 5. Sets up foreground + tap listeners
   */
  async init(): Promise<void> {
    if (_isInitialized) return;

    // Expo Go check — push was removed from Expo Go in SDK 53
    _isExpoGo = checkIsExpoGo();
    if (_isExpoGo) {
      console.log('[Push] Running in Expo Go — push notifications disabled');
      return;
    }

    // Physical device check — push won't work on simulators
    if (!Device.isDevice) {
      console.warn('[Push] Must use physical device for push notifications');
      return;
    }

    // Lazy-load expo-notifications to avoid crash in Expo Go
    const loaded = await loadNotificationsModule();
    if (!loaded || !Notifications) {
      console.warn('[Push] Could not load expo-notifications');
      return;
    }

    try {
      // 1. Set up Android channels
      await this.setupAndroidChannels();

      // 2. Request / check permission
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('[Push] Permission not granted');
        return;
      }

      // 3. Get push token
      const token = await this.getPushToken();
      if (!token) {
        console.warn('[Push] Could not get push token');
        return;
      }

      _pushToken = token;

      // 4. Register with backend
      await this.registerDeviceWithBackend(token);

      // 5. Set up listeners
      this.setupListeners();

      _isInitialized = true;
      console.log('[Push] Initialized successfully');
    } catch (err) {
      console.error('[Push] Init error:', err);
    }
  }

  /** Clean up: remove listeners, unregister device, reset state */
  async teardown(): Promise<void> {
    try {
      if (_pushToken) {
        const deviceId = await api.getDeviceId();
        await api.delete(`/notifications/device/${deviceId}`).catch(() => {});
      }
    } catch {}
    _pushToken = null;
    _isInitialized = false;
    ttsService.stop();
  }

  /** Get the current push token (null if not yet registered) */
  getToken(): string | null {
    return _pushToken;
  }

  // ─── Android Notification Channels ────────────────────────

  private async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android' || !Notifications) return;
    const N = Notifications;

    // Default channel
    await N.setNotificationChannelAsync('default', {
      name: 'General',
      importance: N.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E40AF',
    });

    // KYC channel with custom sound
    await N.setNotificationChannelAsync(KYC_CHANNEL_ID, {
      name: 'KYC Notifications',
      description: 'Alerts for KYC document verification requests',
      importance: N.AndroidImportance.HIGH,
      sound: 'kyc_alert.wav',
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#F59E0B',
      enableVibrate: true,
      enableLights: true,
    });
  }

  // ─── Permissions ──────────────────────────────────────────

  private async requestPermission(): Promise<boolean> {
    if (!Notifications) return false;
    const N = Notifications;

    const { status: existingStatus } = await N.getPermissionsAsync();

    if (existingStatus === 'granted') return true;

    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  }

  // ─── Push Token ───────────────────────────────────────────

  private async getPushToken(): Promise<string | null> {
    if (!Notifications) return null;
    const N = Notifications;

    try {
      // projectId is required for Expo push tokens
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const tokenResponse = await N.getExpoPushTokenAsync({
        projectId: projectId ?? undefined,
      });

      return tokenResponse.data; // e.g. "ExponentPushToken[…]"
    } catch (err) {
      console.error('[Push] Token error:', err);
      return null;
    }
  }

  // ─── Backend Registration ─────────────────────────────────

  private async registerDeviceWithBackend(pushToken: string): Promise<void> {
    try {
      const deviceId = await api.getDeviceId();
      const deviceName =
        Device.modelName ?? Device.deviceName ?? 'Unknown Device';
      const appVersion = Constants.expoConfig?.version ?? '1.0.0';

      const payload: RegisterDeviceRequest = {
        deviceId,
        pushToken,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
        deviceName,
        appVersion,
      };

      await api.post('/notifications/device', payload);
      console.log('[Push] Device registered with backend');
    } catch (err) {
      // Non-blocking — we can retry later
      console.warn('[Push] Backend registration failed:', err);
    }
  }

  // ─── Notification Listeners ───────────────────────────────

  private setupListeners(): void {
    if (!Notifications) return;
    const N = Notifications;

    // Notification received while app is in foreground
    N.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data ?? {};
      console.log('[Push] Foreground notification:', data);

      // TTS is already handled in setNotificationHandler above
    });

    // User tapped on a notification
    N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      console.log('[Push] Notification tapped:', data);

      this.handleNotificationNavigation(data);
    });

    // Listen for background TTS (when app comes to foreground from a notification)
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Check last notification for TTS
        N.getLastNotificationResponseAsync().then((response) => {
          if (!response) return;
          const data = response.notification.request.content.data ?? {};
          if (data.ttsMessage && typeof data.ttsMessage === 'string') {
            // Small delay to let the app fully foreground
            setTimeout(() => ttsService.speak(data.ttsMessage as string), 500);
          }
        });
      }
    });
  }

  // ─── Deep-link Navigation ─────────────────────────────────

  private handleNotificationNavigation(
    data: Record<string, unknown>,
  ): void {
    const screen = data.screen as string | undefined;

    switch (screen) {
      case 'kyc_pending':
        router.push('/(admin)/kyc-review' as any);
        break;
      case 'kyc_status':
        // Client/Realtor viewing their own KYC status
        router.push('/(client)/profile' as any);
        break;
      case 'notifications':
        router.push('/notifications' as any);
        break;
      case 'payment':
        router.push('/(client)/payments' as any);
        break;
      default:
        // If there's a generic deep link path, try navigating to it
        if (data.path && typeof data.path === 'string') {
          router.push(data.path as any);
        }
        break;
    }
  }
}

export const pushService = new PushService();
export default pushService;
