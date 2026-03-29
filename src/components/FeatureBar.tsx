import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface FeatureBarProps {
  label: string;
  percentage: number;
  color: string;
  /** Stagger index — delays animation start by index * 150ms */
  index?: number;
}

/** Lighten a hex color by mixing toward white */
function lightenColor(hex: string, amount = 0.3): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

export function FeatureBar({ label, percentage, color, index = 0 }: FeatureBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const [displayPct, setDisplayPct] = React.useState(0);

  const delay = index * 150;

  useEffect(() => {
    // Staggered entrance: fade + slide up
    const entranceTimer = setTimeout(() => {
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, delay);

    // Bar fill + counter animation
    const fillTimer = setTimeout(() => {
      Animated.timing(widthAnim, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: false,
      }).start();

      const listener = widthAnim.addListener(({ value }) => {
        setDisplayPct(Math.round(value));
      });

      return () => widthAnim.removeListener(listener);
    }, delay);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(fillTimer);
    };
  }, [percentage, delay]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const entranceOpacity = entranceAnim;
  const entranceTranslateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const lighterColor = lightenColor(color.startsWith('#') ? color : '#7c3aed', 0.35);

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: entranceOpacity,
          transform: [{ translateY: entranceTranslateY }],
        },
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fillWrap, { width: barWidth }]}>
          <LinearGradient
            colors={[color, lighterColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fillGradient}
          />
        </Animated.View>
      </View>
      <Text style={[styles.pct, { color }]}>{displayPct}%</Text>
    </Animated.View>
  );
}

interface FeatureBreakdownProps {
  emoji: string;
  label: string;
  note: string;
  bars: { label: string; percentage: number; color: string }[];
  winner?: string | null;
  /** Base index for staggered animation across all bars in the breakdown */
  baseIndex?: number;
}

export function FeatureBreakdown({ emoji, label, note, bars, winner, baseIndex = 0 }: FeatureBreakdownProps) {
  const winnerScale = useRef(new Animated.Value(0.8)).current;
  const winnerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (winner) {
      // Delay winner badge until after bars animate
      const totalBarDelay = (baseIndex + bars.length) * 150 + 800;
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(winnerScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 14,
            bounciness: 8,
          }),
          Animated.timing(winnerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, totalBarDelay);
      return () => clearTimeout(timer);
    }
  }, [winner, baseIndex, bars.length]);

  return (
    <View style={styles.breakdown}>
      <View style={styles.nameRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.nameCol}>
          <Text style={styles.featureName}>{label}</Text>
          <Text style={styles.featureNote}>{note}</Text>
        </View>
      </View>
      {bars.map((bar, i) => (
        <FeatureBar key={i} {...bar} index={baseIndex + i} />
      ))}
      {winner && (
        <Animated.View
          style={[
            styles.winnerRow,
            {
              opacity: winnerOpacity,
              transform: [{ scale: winnerScale }],
            },
          ]}
        >
          <Text
            style={[
              styles.winnerBadge,
              winner === 'tie'
                ? styles.winnerTie
                : winner === 'p1'
                  ? styles.winnerP1
                  : styles.winnerP2,
            ]}
          >
            {winner === 'tie'
              ? '\u2248 Equal from both'
              : `\u25B6 From ${winner === 'p1' ? 'Parent 1' : 'Parent 2'}`}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  label: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fillGradient: {
    flex: 1,
    borderRadius: 4,
  },
  pct: {
    width: 38,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  breakdown: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  nameCol: {
    flex: 1,
  },
  featureName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  featureNote: {
    color: colors.textMuted,
    fontSize: 11,
  },
  winnerRow: {
    marginTop: 6,
    marginLeft: 70 + spacing.sm,
  },
  winnerBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  winnerTie: {
    color: colors.child,
    backgroundColor: 'rgba(5,150,105,0.15)',
  },
  winnerP1: {
    color: colors.p1,
    backgroundColor: 'rgba(37,99,235,0.15)',
  },
  winnerP2: {
    color: colors.p2,
    backgroundColor: 'rgba(219,39,119,0.15)',
  },
});
