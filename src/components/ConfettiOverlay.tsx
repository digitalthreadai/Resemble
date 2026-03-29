import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface ConfettiOverlayProps {
  /** When active/trigger becomes true, fires confetti */
  active?: boolean;
  /** Alias for active (backward compat) */
  trigger?: boolean;
  /** Called after confetti animation completes */
  onComplete?: () => void;
}

const THEME_COLORS = [
  '#7c3aed', // primary purple
  '#a855f7', // light purple
  '#6366f1', // indigo
  '#2563eb', // blue (p1)
  '#059669', // green (child)
  '#f59e0b', // amber (celeb)
];

/**
 * Confetti overlay wrapping react-native-confetti-cannon.
 * Fires 40 pieces from center-top when `active` becomes true.
 * Auto-hides after animation completes.
 */
export function ConfettiOverlay({ active, trigger, onComplete }: ConfettiOverlayProps) {
  const isActive = active ?? trigger ?? false;
  const prevActive = useRef(false);
  const [show, setShow] = React.useState(false);

  useEffect(() => {
    // Fire when active transitions from false to true
    if (isActive && !prevActive.current) {
      setShow(true);
    }
    prevActive.current = isActive;
  }, [isActive]);

  const handleAnimationEnd = () => {
    setShow(false);
    onComplete?.();
  };

  if (!show) return null;

  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container} pointerEvents="none">
      <ConfettiCannon
        count={40}
        origin={{ x: width / 2, y: -10 }}
        colors={THEME_COLORS}
        fadeOut
        autoStart
        onAnimationEnd={handleAnimationEnd}
        fallSpeed={2500}
        explosionSpeed={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});
