export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const IconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 48,
} as const;

export const HitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
} as const;

/** Minimum touch target per accessibility guidelines */
export const MIN_TOUCH_TARGET = 44;
