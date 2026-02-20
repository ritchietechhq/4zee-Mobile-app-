// ============================================================
// Theme Store — persists dark/light preference to AsyncStorage
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const THEME_KEY = '4zee_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  /** Resolved to actual light/dark (system resolved) */
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  loadSavedTheme: () => Promise<void>;
}

const resolveIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') return Appearance.getColorScheme() === 'dark';
  return mode === 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,

  setMode: (mode: ThemeMode) => {
    const isDark = resolveIsDark(mode);
    set({ mode, isDark });
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  },

  loadSavedTheme: async () => {
    try {
      const saved = (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      const mode = saved || 'light';
      set({ mode, isDark: resolveIsDark(mode) });
    } catch {
      set({ mode: 'light', isDark: false });
    }
  },
}));
