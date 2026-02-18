import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { ApiResponse } from '@/types';

const uuid = () => Crypto.randomUUID();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://fourzeeproperties-backend.onrender.com/api/v1';
const REQUEST_TIMEOUT = 30_000;

const ACCESS_TOKEN_KEY = '4zee_access_token';
const REFRESH_TOKEN_KEY = '4zee_refresh_token';
const DEVICE_ID_KEY = '4zee_device_id';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuid();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/** Callback invoked when the refresh token itself is expired — force logout */
let onForceLogout: (() => void) | null = null;

export function setForceLogoutCallback(cb: () => void) {
  onForceLogout = cb;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ------ Queue management for concurrent 401 handling ------

  private processQueue(error: AxiosError | null, token: string | null = null) {
    this.failedQueue.forEach((p) => {
      if (error) p.reject(error);
      else p.resolve(token);
    });
    this.failedQueue = [];
  }

  // ------ Interceptors ------

  private setupInterceptors() {
    // ---- REQUEST interceptor ----
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const [token, deviceId] = await Promise.all([
          this.getAccessToken(),
          getOrCreateDeviceId(),
        ]);

        // Required headers per API contract
        config.headers['X-Request-Id'] = uuid();
        config.headers['X-Device-Id'] = deviceId;

        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Idempotency key for write operations
        const method = config.method?.toLowerCase();
        if (method === 'post' || method === 'put' || method === 'patch') {
          if (!config.headers['Idempotency-Key']) {
            config.headers['Idempotency-Key'] = uuid();
          }
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // ---- RESPONSE interceptor ----
    this.client.interceptors.response.use(
      // Unwrap: axios `response.data` is the full ApiResponse<T>
      (response) => response.data,
      async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };
        const errorCode = error.response?.data?.error?.code;

        // Token expired → attempt refresh
        if (errorCode === 'AUTH_TOKEN_EXPIRED' && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((newToken) => {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');

            // Use raw axios to bypass our interceptors
            const { data: envelope } = await axios.post<
              ApiResponse<{
                accessToken: string;
                refreshToken: string;
                expiresIn: number;
                refreshExpiresIn: number;
              }>
            >(`${API_BASE_URL}/auth/refresh`, { refreshToken });

            const tokens = envelope.data!;
            await this.setAccessToken(tokens.accessToken);
            await this.setRefreshToken(tokens.refreshToken);

            this.processQueue(null, tokens.accessToken);

            originalRequest.headers['Authorization'] =
              `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError as AxiosError, null);
            await this.clearTokens();
            onForceLogout?.();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Refresh token expired → force logout
        if (errorCode === 'AUTH_REFRESH_TOKEN_EXPIRED') {
          await this.clearTokens();
          onForceLogout?.();
        }

        // Reject with the structured API error envelope
        return Promise.reject(error.response?.data || error);
      },
    );
  }

  // ------ Token management (AsyncStorage) ------

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  async getDeviceId(): Promise<string> {
    return getOrCreateDeviceId();
  }

  // ------ HTTP helpers ------
  // Each returns the FULL unwrapped ApiResponse<T>.
  // The response interceptor already extracts `response.data`,
  // so `this.client.get(...)` resolves to the ApiResponse<T> object.

  async get<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.client.get(url, { params }) as Promise<ApiResponse<T>>;
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.client.post(url, data) as Promise<ApiResponse<T>>;
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.client.put(url, data) as Promise<ApiResponse<T>>;
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.client.patch(url, data) as Promise<ApiResponse<T>>;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.client.delete(url) as Promise<ApiResponse<T>>;
  }

  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.client.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<ApiResponse<T>>;
  }
}

export const api = new ApiClient();
export default api;
