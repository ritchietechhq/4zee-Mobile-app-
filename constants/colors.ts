// ============================================================
// Color System — Light & Dark Palettes
// ============================================================

export const LightColors = {
  // Brand
  primary: '#1E40AF',
  primaryLight: '#E0F2FE',
  accent: '#3B82F6',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F9FAFB',
  cardBackground: '#FFFFFF',
  inputBackground: '#F9FAFB',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textTertiary: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Status
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',

  // Static
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.08)',

  // Tab Bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#1E40AF',
  tabBarInactive: '#9CA3AF',

  // Extended palette (quick actions, notifications, etc.)
  teal: '#0D9488',
  tealLight: '#CCFBF1',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  orange: '#EA580C',
  orangeLight: '#FFF7ED',
  indigo: '#6366F1',
  indigoLight: '#EEF2FF',
  sky: '#0EA5E9',
  skyLight: '#E0F2FE',
  slate: '#64748B',
  slateLight: '#F1F5F9',
} as const;

// ThemeColors type uses string for all values so dark palette can differ
export type ThemeColors = { [K in keyof typeof LightColors]: string };

export const DarkColors: ThemeColors = {
  // Brand — slightly brighter for dark bg
  primary: '#60A5FA',
  primaryLight: '#1E3A5F',
  accent: '#93C5FD',

  // Backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  cardBackground: '#1E293B',
  inputBackground: '#1E293B',

  // Text — inverted
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textTertiary: '#64748B',

  // Borders
  border: '#334155',
  borderLight: '#1E293B',

  // Status — slightly softer for dark
  success: '#4ADE80',
  successLight: '#14532D',
  warning: '#FBBF24',
  warningLight: '#422006',
  error: '#F87171',
  errorLight: '#450A0A',

  // Static
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',

  // Tab Bar
  tabBarBackground: '#0F172A',
  tabBarActive: '#60A5FA',
  tabBarInactive: '#64748B',

  // Extended palette — muted for dark
  teal: '#2DD4BF',
  tealLight: '#134E4A',
  purple: '#A78BFA',
  purpleLight: '#2E1065',
  pink: '#F472B6',
  pinkLight: '#500724',
  orange: '#FB923C',
  orangeLight: '#431407',
  indigo: '#818CF8',
  indigoLight: '#1E1B4B',
  sky: '#38BDF8',
  skyLight: '#0C4A6E',
  slate: '#94A3B8',
  slateLight: '#1E293B',
} as const;

/** Backwards-compatible static export (light palette) */
export const Colors = LightColors;
export type ColorKey = keyof ThemeColors;

