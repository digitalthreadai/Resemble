import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/** Shimmer overlay for loading state */
function ShimmerOverlay() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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
    outputRange: [-200, 200],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={shimmerStyles.container}>
        <Animated.View
          style={[
            shimmerStyles.sweep,
            { transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );
}

const shimmerStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  sweep: {
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...(Platform.OS === 'web'
      ? { filter: 'blur(20px)' }
      : {}),
  },
});

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const webInteractive = Platform.OS === 'web' && !isDisabled;

  const content = (
    <>
      {loading ? (
        <>
          <Text
            style={[
              styles.text,
              variant === 'ghost' && styles.ghostText,
              { opacity: 0.5 },
              textStyle,
            ]}
          >
            {icon ? `${icon} ${title}` : title}
          </Text>
          <ShimmerOverlay />
        </>
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'ghost' && styles.ghostText,
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {icon ? `${icon} ${title}` : title}
        </Text>
      )}
    </>
  );

  const baseStyles: ViewStyle[] = [
    styles.base,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    isDisabled && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  // Web-only styles for cursor + transitions
  const webStyles: any = webInteractive
    ? {
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }
    : {};

  const ghostWebStyles: any =
    Platform.OS === 'web' && variant === 'ghost' && !isDisabled
      ? {
          transition: 'border-color 0.2s ease, transform 0.15s ease',
          borderWidth: 1,
          borderColor: 'transparent',
        }
      : {};

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={['#7c3aed', '#6366f1'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.base,
              isDisabled && styles.disabled,
              style as ViewStyle,
              webStyles,
            ]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[...baseStyles, webStyles, ghostWebStyles]}>
            {content}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
  },
  secondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostText: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
