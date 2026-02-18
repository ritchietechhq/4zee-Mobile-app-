import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 32,
} as const;

export const LineHeight = {
  xs: 16,
  sm: 18,
  md: 24,
  lg: 26,
  xl: 30,
  xxl: 36,
  xxxl: 40,
} as const;

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: FontSize.xxxl,
    lineHeight: LineHeight.xxxl,
    fontWeight: '700',
  },
  h2: {
    fontSize: FontSize.xxl,
    lineHeight: LineHeight.xxl,
    fontWeight: '700',
  },
  h3: {
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: '600',
  },
  h4: {
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: '600',
  },
  body: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '500',
  },
  bodySemiBold: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '600',
  },
  caption: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '400',
  },
  captionMedium: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '500',
  },
  small: {
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: '400',
  },
  button: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '600',
  },
  buttonSmall: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '600',
  },
};
