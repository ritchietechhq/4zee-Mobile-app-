import { Colors } from './colors';
import { Typography, FontSize, LineHeight } from './typography';
import { Spacing, BorderRadius, IconSize, HitSlop, MIN_TOUCH_TARGET } from './spacing';
import { ViewStyle } from 'react-native';

export const Shadows: Record<string, ViewStyle> = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Theme = {
  colors: Colors,
  typography: Typography,
  fontSize: FontSize,
  lineHeight: LineHeight,
  spacing: Spacing,
  borderRadius: BorderRadius,
  iconSize: IconSize,
  hitSlop: HitSlop,
  minTouchTarget: MIN_TOUCH_TARGET,
  shadows: Shadows,
} as const;

export type AppTheme = typeof Theme;

export { Colors, Typography, FontSize, LineHeight, Spacing, BorderRadius, IconSize, HitSlop, MIN_TOUCH_TARGET };
