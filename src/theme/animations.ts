/**
 * Shared animation configuration constants.
 * These are plain config objects — not hooks or Animated values.
 */

export const fadeUp = {
  duration: 500,
  translateY: 20,
  easing: 'easeOut' as const,
};

export const scaleIn = {
  duration: 400,
  fromScale: 0.9,
  easing: 'spring' as const,
};

export const shimmerDuration = 1500;

export const pulseGlow = {
  duration: 2000,
  minOpacity: 0.4,
  maxOpacity: 1,
};

export const counterSpin = {
  duration: 1200,
};

/** Milliseconds between staggered items. */
export const staggerDelay = 150;

/** CSS transition string for web hover/interactive states. */
export const transition = '0.25s cubic-bezier(0.4, 0, 0.2, 1)';
