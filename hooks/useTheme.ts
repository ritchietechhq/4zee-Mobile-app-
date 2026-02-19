// ============================================================
// useTheme Hook
// Provides theme colors based on light/dark mode preference
// ============================================================

import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { Colors, DarkModeColors } from '@/constants/colors';

export const useTheme = () => {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const mode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);

  const colors = useMemo(() => (isDarkMode ? DarkModeColors : Colors), [isDarkMode]);

  return {
    isDarkMode,
    mode,
    colors,
    setThemeMode,
  };
};
