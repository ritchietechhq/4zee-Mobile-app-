// ============================================================
// Push Notification Service
// Handles: Expo push token registration, notification channels,
//          foreground/background handlers, deep-link navigation,
//          TTS voice alerts, and device registration with backend.
// ============================================================

import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import api from './api';
import { ttsService } from './tts.service';
import type { RegisterDeviceRequest } from '@/types';

// ─── Android Notification Channels ────────────────────────────
const KYC_CHANNEL_ID = 'kyc_notifications';

// ─── State ────────────────────────────────────────────────────
let _pushToken: string | null = null;
let _isInitialized = false;

// ─── Foreground presentation config ──────────────────────────
// Show banner + play sound even when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data ?? {};

    // If it has a TTS payload, speak it (foreground only)
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

    // Physical device check — push won't work on simulators
    if (!Device.isDevice) {
      console.warn('[Push] Must use physical device for push notifications');
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
    if (Platform.OS !== 'android') return;

    // Default channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E40AF',
    });

    // KYC channel with custom sound
    await Notifications.setNotificationChannelAsync(KYC_CHANNEL_ID, {
      name: 'KYC Notifications',
      description: 'Alerts for KYC document verification requests',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'kyc_alert.wav',
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#F59E0B',
      enableVibrate: true,
      enableLights: true,
    });
  }

  // ─── Permissions ──────────────────────────────────────────

  private async requestPermission(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // ─── Push Token ───────────────────────────────────────────

  private async getPushToken(): Promise<string | null> {
    try {
      // projectId is required for Expo push tokens
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
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
    // Notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data ?? {};
      console.log('[Push] Foreground notification:', data);

      // TTS is already handled in setNotificationHandler above
    });

    // User tapped on a notification
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      console.log('[Push] Notification tapped:', data);

      this.handleNotificationNavigation(data);
    });

    // Listen for background TTS (when app comes to foreground from a notification)
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Check last notification for TTS
        Notifications.getLastNotificationResponseAsync().then((response) => {
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
