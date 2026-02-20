// ============================================================
// useTheme Hook
// Provides theme colors based on light/dark mode preference
// ============================================================

import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { LightColors, DarkColors } from '@/constants/colors';

export const useTheme = () => {
  const isDark = useThemeStore((s) => s.isDark);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const colors = useMemo(() => (isDark ? DarkColors : LightColors), [isDark]);

  return {
    isDarkMode: isDark,   // backward compat alias
    isDark,
    mode,
    colors,
    setThemeMode: setMode, // backward compat alias
  };
};
