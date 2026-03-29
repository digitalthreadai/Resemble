import { Platform, ViewStyle } from 'react-native';
import { transition } from './animations';
import { colors } from './colors';

type WebCSSStyle = ViewStyle & Record<string, unknown>;

const webVariants: Record<string, WebCSSStyle> = {
  glass: {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  } as WebCSSStyle,
  card: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    transition,
  } as WebCSSStyle,
  interactive: {
    cursor: 'pointer',
    transition,
  } as WebCSSStyle,
};

/**
 * Returns baseStyle on native platforms.
 * On web, merges baseStyle with the named web-enhancement variant.
 *
 * For the 'glow' variant pass the glow color as the second arg:
 *   useWebStyle(style, 'glow:#7c3aed')
 */
export function useWebStyle<T extends ViewStyle>(
  baseStyle: T,
  variant?: string,
): T & Record<string, unknown> {
  if (Platform.OS !== 'web' || !variant) return baseStyle as unknown as T & Record<string, unknown>;

  // Handle glow variant with color param: 'glow:rgba(124,58,237,0.4)'
  if (variant.startsWith('glow:')) {
    const color = variant.slice(5);
    return {
      ...baseStyle,
      boxShadow: `0 0 20px ${color}`,
      transition,
    } as unknown as T & Record<string, unknown>;
  }

  const enhancement = webVariants[variant];
  if (!enhancement) return baseStyle as unknown as T & Record<string, unknown>;

  return { ...baseStyle, ...enhancement } as unknown as T & Record<string, unknown>;
}

/**
 * Injects global CSS hover classes on web.
 * Safe to call on native — it no-ops.
 */
function injectGlobalStyles(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;

  const id = '__resemble-global-styles';
  if (document.getElementById(id)) return;

  const css = `
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}
.hover-glow-primary:hover {
  box-shadow: 0 0 20px ${colors.primaryGlow};
}
.hover-glow-p1:hover {
  box-shadow: 0 0 20px ${colors.p1Glow};
}
.hover-glow-p2:hover {
  box-shadow: 0 0 20px ${colors.p2Glow};
}
.hover-glow-child:hover {
  box-shadow: 0 0 20px ${colors.childGlow};
}
.hover-glow-celeb:hover {
  box-shadow: 0 0 20px ${colors.celebGlow};
}
`;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

// Auto-inject on web at module load
injectGlobalStyles();
