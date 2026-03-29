import { Dimensions, Platform, useWindowDimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1200,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const isSmallScreen = width < 380;
export const isWeb = Platform.OS === 'web';

export const maxContentWidth = 1200;

/**
 * Returns the current breakpoint string based on window width.
 * 'sm' for < 480, 'md' for < 768, 'lg' for < 1024, 'xl' for >= 1024.
 */
export function useResponsive(): Breakpoint {
  const { width: w } = useWindowDimensions();
  if (w >= breakpoints.xl) return 'xl';
  if (w >= breakpoints.lg) return 'lg';
  if (w >= breakpoints.md) return 'md';
  return 'sm';
}
