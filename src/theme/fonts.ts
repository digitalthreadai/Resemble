import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  useFonts as useJetBrainsMono,
  JetBrainsMono_400Regular,
} from '@expo-google-fonts/jetbrains-mono';
import { Platform } from 'react-native';

/** System-font fallbacks per platform. */
const systemDisplay = Platform.select({
  web: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  default: 'System',
})!;

const systemBody = Platform.select({
  web: "'Inter', system-ui, sans-serif",
  default: 'System',
})!;

const systemMono = Platform.select({
  web: "'JetBrains Mono', 'Fira Code', monospace",
  default: 'monospace',
})!;

/**
 * Font family constants.
 * Use these in style objects: { fontFamily: fontFamily.display }
 * Falls back to system fonts if Google Fonts fail to load.
 */
export const fontFamily = {
  display: 'SpaceGrotesk_700Bold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
} as const;

/** System font fallbacks for when custom fonts haven't loaded yet. */
export const fontFamilyFallback = {
  display: systemDisplay,
  body: systemBody,
  bodyBold: systemBody,
  mono: systemMono,
} as const;

/**
 * Loads all three font families (Space Grotesk, Inter, JetBrains Mono).
 * Returns { fontsLoaded, fontError }.
 * Components should use fontFamilyFallback when fontsLoaded is false.
 */
export function useFonts(): { fontsLoaded: boolean; fontError: Error | null } {
  const [sgLoaded, sgError] = useSpaceGrotesk({ SpaceGrotesk_700Bold });
  const [interLoaded, interError] = useInter({ Inter_400Regular, Inter_700Bold });
  const [jbLoaded, jbError] = useJetBrainsMono({ JetBrainsMono_400Regular });

  const fontsLoaded = sgLoaded && interLoaded && jbLoaded;
  const fontError = sgError || interError || jbError || null;

  return { fontsLoaded, fontError };
}
