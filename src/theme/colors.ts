/**
 * Color system matching the original Resemble dark glassmorphism theme.
 */
export const colors = {
  // Background
  bg: '#0a0a1a',
  bgCard: 'rgba(255,255,255,0.07)',
  bgCardHover: 'rgba(255,255,255,0.11)',
  bgOverlay: 'rgba(0,0,0,0.6)',

  // Primary (purple)
  primary: '#7c3aed',
  primaryLight: '#a855f7',
  primaryDark: '#6d28d9',

  // Slot colors
  p1: '#2563eb',       // Parent 1 (blue)
  p2: '#db2777',       // Parent 2 (pink)
  child: '#059669',    // Child (green)
  celeb: '#f59e0b',    // Celebrity (amber)
  you: '#7c3aed',      // You (purple)

  // Landmark region colors
  jawline: '#10b981',
  eyebrows: '#8b5cf6',
  nose: '#f59e0b',
  eyes: '#3b82f6',
  mouth: '#ef4444',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // Text
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',

  // Borders
  border: 'rgba(255,255,255,0.12)',
  borderLight: 'rgba(255,255,255,0.18)',

  // Surface layers
  surface0: '#0a0a1a',
  surface1: 'rgba(255,255,255,0.08)',
  surface2: 'rgba(255,255,255,0.12)',
  surface3: 'rgba(255,255,255,0.16)',

  // Light variants
  p1Light: 'rgba(37,99,235,0.15)',
  p2Light: 'rgba(219,39,119,0.15)',
  childLight: 'rgba(5,150,105,0.15)',
  celebLight: 'rgba(245,158,11,0.15)',
  primaryLight15: 'rgba(124,58,237,0.15)',

  // Glow colors
  primaryGlow: 'rgba(124,58,237,0.4)',
  p1Glow: 'rgba(37,99,235,0.4)',
  p2Glow: 'rgba(219,39,119,0.4)',
  childGlow: 'rgba(5,150,105,0.4)',
  celebGlow: 'rgba(245,158,11,0.4)',
} as const;

/** Gradient color pairs for LinearGradient usage. */
export const gradients = {
  primaryGrad: ['#7c3aed', '#6366f1'] as const,
  p1Grad: ['#2563eb', '#3b82f6'] as const,
  p2Grad: ['#db2777', '#ec4899'] as const,
  childGrad: ['#059669', '#10b981'] as const,
  celebGrad: ['#f59e0b', '#fbbf24'] as const,
} as const;
