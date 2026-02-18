// ============================================================
// Auth Store — Zustand
// Handles login, register, 2FA, session, role
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  UserRole,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
} from '@/types';
import { is2FARequired } from '@/types';
import authService from '@/services/auth.service';
import api, { setForceLogoutCallback } from '@/services/api';

const ROLE_KEY = '4zee_user_role';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: UserRole | null;

  // 2FA challenge state
  pending2FA: { userId: string } | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (payload: RegisterRequest) => Promise<void>;
  verify2FA: (userId: string, code: string) => Promise<void>;
  logout: (logoutAll?: boolean) => Promise<void>;
  loadSession: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  loadRole: () => Promise<UserRole | null>;
  clearError: () => void;
  clear2FA: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: null,
  pending2FA: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null, pending2FA: null });
    try {
      const response = await authService.login(credentials);

      if (is2FARequired(response)) {
        set({
          isLoading: false,
          pending2FA: { userId: response.userId },
        });
        return response;
      }

      // Full auth — tokens already stored by authService
      const user = response.user;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        role: user.role,
      });
      await AsyncStorage.setItem(ROLE_KEY, user.role);
      return response;
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        (error instanceof Error ? error.message : 'Login failed.');
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  register: async (payload: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authService.register(payload);
      const user = tokens.user;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        role: user.role,
      });
      await AsyncStorage.setItem(ROLE_KEY, user.role);
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        (error instanceof Error ? error.message : 'Registration failed.');
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  verify2FA: async (userId: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authService.verify2FA({ userId, code });
      const user = tokens.user;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        role: user.role,
        pending2FA: null,
      });
      await AsyncStorage.setItem(ROLE_KEY, user.role);
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        (error instanceof Error ? error.message : '2FA verification failed.');
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async (logoutAll = false) => {
    set({ isLoading: true });
    try {
      await authService.logout(logoutAll);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        pending2FA: null,
      });
    }
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const token = await api.getAccessToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const user = await authService.getMe();
      const savedRole = (await AsyncStorage.getItem(ROLE_KEY)) as UserRole | null;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        role: savedRole || user.role,
      });
    } catch {
      await api.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setRole: async (role: UserRole) => {
    await AsyncStorage.setItem(ROLE_KEY, role);
    set({ role });
  },

  loadRole: async () => {
    const role = (await AsyncStorage.getItem(ROLE_KEY)) as UserRole | null;
    if (role) set({ role });
    return role;
  },

  clearError: () => set({ error: null }),
  clear2FA: () => set({ pending2FA: null }),
}));

// Register the force-logout callback so the API interceptor can
// redirect to login when a refresh token expires.
setForceLogoutCallback(() => {
  useAuthStore.getState().logout();
});
