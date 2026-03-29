import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface GaugeChartProps {
  label: string;
  percentage: number;
  color: string;
  size?: number;
}

export function GaugeChart({ label, percentage, color, size = 110 }: GaugeChartProps) {
  const animRef = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const [currentPct, setCurrentPct] = React.useState(0);
  const [animComplete, setAnimComplete] = React.useState(false);

  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    setAnimComplete(false);
    tagOpacity.setValue(0);

    Animated.timing(animRef, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: false,
    }).start(() => {
      setAnimComplete(true);
      // Fade in the descriptor tag after counter completes
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });

    const listener = animRef.addListener(({ value }) => {
      setCurrentPct(Math.round(value));
    });
    return () => animRef.removeListener(listener);
  }, [percentage]);

  // Compute strokeDashoffset from state (avoids AnimatedCircle + collapsable warning on web)
  const offset = circumference - (currentPct / 100) * circumference;

  const tag =
    percentage >= 65
      ? 'Strong resemblance'
      : percentage >= 45
        ? 'Good resemblance'
        : 'Some resemblance';

  // Web glow via boxShadow matching the color at 40% opacity
  const webGlow: any =
    Platform.OS === 'web'
      ? { boxShadow: `0 0 24px ${color}66` }
      : {};

  return (
    <View style={[styles.container, webGlow]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.gaugeWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={8}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[styles.pctWrap, { width: size, height: size }]}>
          <Text style={styles.pctText}>{currentPct}%</Text>
        </View>
      </View>
      <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>{tag}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 140,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  gaugeWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  tag: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
