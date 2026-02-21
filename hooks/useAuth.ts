// ============================================================
// useAuth Hook
// Wraps auth store with navigation logic
// ============================================================

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { LoginRequest, RegisterRequest } from '@/types';
import { is2FARequired } from '@/types';
import { router } from 'expo-router';

/** Route to the correct dashboard for the given role */
function navigateToDashboard(currentRole: string | null) {
  if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') {
    router.replace('/(admin)/(tabs)/dashboard' as any);
  } else if (currentRole === 'REALTOR') {
    router.replace('/(realtor)/dashboard' as any);
  } else {
    router.replace('/(client)/dashboard' as any);
  }
}

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    role,
    pending2FA,
    login,
    register,
    verify2FA,
    logout,
    loadSession,
    clearError,
    clear2FA,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const response = await login(credentials);

        if (is2FARequired(response)) {
          // Navigate to 2FA screen — the store holds pending2FA state
          return;
        }

        // Navigate based on role
        navigateToDashboard(useAuthStore.getState().role);
      } catch {
        // Error is set in store
      }
    },
    [login],
  );

  const handleRegister = useCallback(
    async (payload: RegisterRequest) => {
      try {
        await register(payload);
        navigateToDashboard(useAuthStore.getState().role);
      } catch {
        // Error is set in store
      }
    },
    [register],
  );

  const handleVerify2FA = useCallback(
    async (userId: string, code: string) => {
      try {
        await verify2FA(userId, code);
        navigateToDashboard(useAuthStore.getState().role);
      } catch {
        // Error is set in store
      }
    },
    [verify2FA],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    role,
    pending2FA,
    login: handleLogin,
    register: handleRegister,
    verify2FA: handleVerify2FA,
    logout: handleLogout,
    loadSession,
    clearError,
    clear2FA,
  };
}
