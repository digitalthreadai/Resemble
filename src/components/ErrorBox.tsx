import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface ErrorBoxProps {
  message: string;
}

export function ErrorBox({ message }: ErrorBoxProps) {
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle shake animation: 3 oscillations, 50ms each
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 6, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeX, { toValue: 5, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeX, { toValue: -5, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeX, { toValue: 3, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [message, shakeX]);

  return (
    <Animated.View
      style={[
        styles.errorBox,
        { transform: [{ translateX: shakeX }] },
      ]}
    >
      <Ionicons name="warning" size={18} color="#f87171" style={styles.icon} />
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    marginTop: 1,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
