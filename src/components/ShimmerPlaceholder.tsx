import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

interface ShimmerPlaceholderProps {
  width: number;
  height: number;
  borderRadius?: number;
}

/**
 * Animated shimmer placeholder — dark-to-lighter-to-dark sweep moving left to right.
 * Uses RN Animated (not Reanimated) for simplicity. 1.5s loop, linear timing.
 */
export function ShimmerPlaceholder({
  width,
  height,
  borderRadius = 8,
}: ShimmerPlaceholderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.sweep,
          {
            transform: [{ translateX }],
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    overflow: 'hidden',
    position: 'relative',
  },
  sweep: {
    width: 120,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...(Platform.OS === 'web'
      ? { filter: 'blur(24px)' }
      : {}),
  },
});
