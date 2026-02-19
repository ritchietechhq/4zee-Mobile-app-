// ============================================================
// Theme Store — Zustand
// Manages dark mode preference and persists to AsyncStorage
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const THEME_KEY = '4zee_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  isDarkMode: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemePreference: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'auto',
  isDarkMode: false,

  setThemeMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem(THEME_KEY, mode);
    set((state) => {
      const systemScheme = useColorScheme();
      const isDark = mode === 'dark' || (mode === 'auto' && systemScheme === 'dark');
      return { mode, isDarkMode: isDark };
    });
  },

  loadThemePreference: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      const mode = (saved as ThemeMode) || 'auto';
      const systemScheme = useColorScheme();
      const isDark = mode === 'dark' || (mode === 'auto' && systemScheme === 'dark');
      set({ mode, isDarkMode: isDark });
    } catch {
      set({ mode: 'auto', isDarkMode: false });
    }
  },

  toggleDarkMode: async () => {
    const current = get().mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'light' === current ? 'dark' : 'dark';
    await get().setThemeMode(next);
  },
}));
