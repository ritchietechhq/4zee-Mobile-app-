// ============================================================
// useThemeColors — returns the active color palette
// ============================================================

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { LightColors, DarkColors, type ThemeColors } from '@/constants/colors';

/**
 * Returns the active color palette (light or dark) based on the user's preference.
 * Use this instead of importing `Colors` directly in components.
 */
export function useThemeColors(): ThemeColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DarkColors : LightColors;
}

/**
 * Returns { colors, isDark } for components that need both.
 */
export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  const mode = useThemeStore((s) => s.mode);
  return {
    colors: isDark ? DarkColors : LightColors,
    isDark,
    mode,
  };
}

/**
 * Returns light colors always - for realtor/admin screens
 * Dark mode can be enabled later by changing this to useThemeColors
 */
export function useLightColors(): ThemeColors {
  return LightColors;
}

/**
 * Realtor-specific theme hook.
 * Defaults to light mode during the day, automatically switches to dark
 * between 19:00 (7 PM) and 06:00 (6 AM).
 * Respects the user's explicit theme preference when set to 'light' or 'dark';
 * only auto-switches when the store mode is 'system' (the default).
 */
export function useRealtorColors(): ThemeColors {
  const storeMode = useThemeStore((s) => s.mode);
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours();
    return h >= 19 || h < 6;
  });

  useEffect(() => {
    // Check every minute whether we've crossed the day/night boundary
    const id = setInterval(() => {
      const h = new Date().getHours();
      setIsNight(h >= 19 || h < 6);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Explicit user override takes priority
  if (storeMode === 'dark') return DarkColors;
  if (storeMode === 'light') return LightColors;
  // 'system' → auto: dark at night, light during the day
  return isNight ? DarkColors : LightColors;
}
