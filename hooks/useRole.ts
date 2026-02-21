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
        if (selectedRole === 'ADMIN' || selectedRole === 'SUPER_ADMIN') {
          router.replace('/(admin)/(tabs)/dashboard' as any);
        } else if (selectedRole === 'REALTOR') {
          router.replace('/(realtor)/dashboard' as any);
        } else {
          router.replace('/(client)/dashboard' as any);
        }
      } else {
        router.replace('/login');
      }
    },
    [setRole, isAuthenticated],
  );

  const initializeRole = useCallback(async () => {
    return await loadRole();
  }, [loadRole]);

  const isClient = role === 'CLIENT';
  const isRealtor = role === 'REALTOR';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return {
    role,
    isClient,
    isRealtor,
    isAdmin,
    isSuperAdmin,
    selectRole,
    initializeRole,
  };
}
