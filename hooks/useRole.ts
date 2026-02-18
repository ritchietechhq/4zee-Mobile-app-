// ============================================================
// useRole Hook
// ============================================================

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';
import { router } from 'expo-router';

export function useRole() {
  const { role, setRole, loadRole, isAuthenticated } = useAuthStore();

  const selectRole = useCallback(
    async (selectedRole: UserRole) => {
      await setRole(selectedRole);
      if (isAuthenticated) {
        if (selectedRole === 'REALTOR') {
          router.replace('/(realtor)/dashboard');
        } else {
          router.replace('/(client)/dashboard');
        }
      } else {
        router.replace('/(auth)/login');
      }
    },
    [setRole, isAuthenticated],
  );

  const initializeRole = useCallback(async () => {
    return await loadRole();
  }, [loadRole]);

  const isClient = role === 'CLIENT';
  const isRealtor = role === 'REALTOR';

  return {
    role,
    isClient,
    isRealtor,
    selectRole,
    initializeRole,
  };
}
