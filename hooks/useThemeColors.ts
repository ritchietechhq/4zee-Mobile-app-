// ============================================================
// useThemeColors — returns the active color palette
// ============================================================

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
