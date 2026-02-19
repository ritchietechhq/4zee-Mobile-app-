export const Spacing = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  xxxxl: 36,
  section: 44,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  full: 9999,
} as const;

export const IconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
  xxl: 42,
} as const;

export const HitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
} as const;

/** Minimum touch target per accessibility guidelines */
export const MIN_TOUCH_TARGET = 44;
