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
  systemScheme: 'light' | 'dark' | null;

  // Actions
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemePreference: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  setSystemScheme: (scheme: 'light' | 'dark' | null) => void;
}

// Helper function to compute isDarkMode based on mode and system scheme
function computeIsDarkMode(mode: ThemeMode, systemScheme: 'light' | 'dark' | null): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  // 'auto' mode: use system scheme, default to false if unknown
  return systemScheme === 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'auto',
  isDarkMode: false,
  systemScheme: null,

  setSystemScheme: (scheme: 'light' | 'dark' | null) => {
    set((state) => {
      const isDarkMode = computeIsDarkMode(state.mode, scheme);
      return { systemScheme: scheme, isDarkMode };
    });
  },

  setThemeMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem(THEME_KEY, mode);
    set((state) => {
      const isDarkMode = computeIsDarkMode(mode, state.systemScheme);
      return { mode, isDarkMode };
    });
  },

  loadThemePreference: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      const mode = (saved as ThemeMode) || 'auto';
      const systemScheme = (useColorScheme() || null) as 'light' | 'dark' | null;
      const isDarkMode = computeIsDarkMode(mode, systemScheme);
      set({ mode, isDarkMode, systemScheme });
    } catch {
      set({ mode: 'auto', isDarkMode: false, systemScheme: null });
    }
  },

  toggleDarkMode: async () => {
    const current = get().mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    await get().setThemeMode(next);
  },
}));
