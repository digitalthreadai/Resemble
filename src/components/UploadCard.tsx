import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface UploadCardProps {
  label: string;
  color: string;
  emoji: string;
  imageUri: string | null;
  optional?: boolean;
  qualityPct?: number | null;
  landmarkTag?: string | null;
  detecting?: boolean;
  detectionError?: string | null;
  onPickPhoto: () => void;
  onOpenCamera: () => void;
  onRemove: () => void;
  highlight?: boolean;
}

/** Animated shimmer sweep for detecting overlay */
function DetectingShimmer() {
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
    outputRange: [-300, 300],
  });

  return (
    <View style={detectStyles.overlay}>
      <View style={detectStyles.shimmerContainer}>
        <Animated.View
          style={[
            detectStyles.shimmerSweep,
            { transform: [{ translateX }] },
          ]}
        />
      </View>
      <Text style={detectStyles.text}>Detecting face...</Text>
    </View>
  );
}

const detectStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerSweep: {
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(124,58,237,0.15)',
    ...(Platform.OS === 'web' ? { filter: 'blur(30px)' } : {}),
  },
  text: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});

/** Success checkmark that fades in then out */
function SuccessCheckmark({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]).start(() => {
        // Fade out after a brief display
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
        }, 800);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        checkStyles.container,
        { opacity, transform: [{ scale }] },
      ]}
      pointerEvents="none"
    >
      <View style={checkStyles.circle}>
        <Ionicons name="checkmark" size={28} color="#fff" />
      </View>
    </Animated.View>
  );
}

const checkStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function UploadCard({
  label,
  color,
  emoji,
  imageUri,
  optional,
  qualityPct,
  landmarkTag,
  detecting,
  detectionError,
  onPickPhoto,
  onOpenCamera,
  onRemove,
  highlight,
}: UploadCardProps) {
  const hasImage = !!imageUri;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevDetecting = useRef(detecting);
  const [showCheck, setShowCheck] = React.useState(false);

  // Shake animation on detection error
  useEffect(() => {
    if (detectionError) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [detectionError]);

  // Show checkmark when detection completes successfully
  useEffect(() => {
    if (prevDetecting.current && !detecting && !detectionError && hasImage) {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 1800);
      return () => clearTimeout(timer);
    }
    prevDetecting.current = detecting;
  }, [detecting, detectionError, hasImage]);

  // Web hover styles
  const webCardStyles: any =
    Platform.OS === 'web'
      ? {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: hasImage ? 'default' : 'pointer',
        }
      : {};

  const qualityGradientColors: readonly [string, string] = qualityPct != null
    ? qualityPct >= 75
      ? ['#059669', '#10b981'] as const
      : qualityPct >= 50
        ? ['#d97706', '#f59e0b'] as const
        : ['#dc2626', '#ef4444'] as const
    : ['#059669', '#10b981'] as const;

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={[styles.card, highlight && styles.cardHighlight, webCardStyles]}>
        {/* Label */}
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color }]}>{label}</Text>
          {optional && (
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          )}
        </View>

        {hasImage ? (
          /* Preview */
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            {landmarkTag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{landmarkTag}</Text>
              </View>
            )}
            {qualityPct != null && (
              <LinearGradient
                colors={qualityGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.qualityBadge}
              >
                <Text style={styles.qualityText}>
                  {qualityPct >= 75 ? '\u2705' : qualityPct >= 50 ? '\u26A0\uFE0F' : '\u274C'}{' '}
                  {qualityPct}% quality
                </Text>
              </LinearGradient>
            )}
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            {detecting && <DetectingShimmer />}
            <SuccessCheckmark visible={showCheck} />
            {detectionError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="warning" size={18} color={colors.error} />
                <Text style={styles.errorOverlayText} numberOfLines={2}>{detectionError}</Text>
              </View>
            )}
          </View>
        ) : (
          /* Upload zone */
          <TouchableOpacity style={styles.dropZone} onPress={onPickPhoto} activeOpacity={0.7}>
            <Text style={styles.dropIcon}>{emoji}</Text>
            <Text style={styles.dropText}>Tap to upload photo</Text>
            <Text style={styles.dropHint}>Front-facing works best</Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={onOpenCamera}>
              <Ionicons name="camera" size={18} color={colors.primary} />
              <Text style={styles.cameraBtnText}>Camera</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flex: 1,
    minWidth: 140,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        } as any)
      : {}),
  },
  cardHighlight: {
    borderColor: 'rgba(124,58,237,0.3)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  optionalBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl + 16,
    paddingHorizontal: spacing.lg,
    minHeight: 260,
  },
  dropIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  dropText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dropHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: spacing.md,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    gap: 6,
  },
  cameraBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  previewWrap: {
    position: 'relative',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualityText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239,68,68,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
  },
  errorOverlayText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
});
