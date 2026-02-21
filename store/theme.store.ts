// ============================================================
// Theme Store — persists dark/light preference to AsyncStorage
// Defaults to 'system' so the app follows the device theme.
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
  /** Called when the OS appearance changes — only matters when mode === 'system' */
  onSystemAppearanceChange: () => void;
}

const resolveIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'system') {
    const scheme = Appearance.getColorScheme();
    // getColorScheme() can return 'dark', 'light', or null
    // Default to light when null (no preference detected)
    return scheme === 'dark';
  }
  return mode === 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Default to 'system' so the app automatically follows the device theme
  mode: 'system',
  isDark: Appearance.getColorScheme() === 'dark',

  setMode: (mode: ThemeMode) => {
    const isDark = resolveIsDark(mode);
    set({ mode, isDark });
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  },

  loadSavedTheme: async () => {
    try {
      const saved = (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      const mode = saved || 'system';
      set({ mode, isDark: resolveIsDark(mode) });
    } catch {
      set({ mode: 'system', isDark: resolveIsDark('system') });
    }
  },

  onSystemAppearanceChange: () => {
    const { mode } = get();
    // Only re-resolve when following the system
    if (mode === 'system') {
      set({ isDark: resolveIsDark('system') });
    }
  },
}));
