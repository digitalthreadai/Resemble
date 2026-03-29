import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { spacing, radius, maxContentWidth, breakpoints } from '../src/theme/spacing';
import { UploadCard } from '../src/components/UploadCard';
import { Button } from '../src/components/Button';
import { GaugeChart } from '../src/components/GaugeChart';
import { FeatureBreakdown } from '../src/components/FeatureBar';
import { ComparisonHeader } from '../src/components/ComparisonHeader';
import { ErrorBox } from '../src/components/ErrorBox';
import { ConfettiOverlay } from '../src/components/ConfettiOverlay';
import { ScoreReveal } from '../src/components/ScoreReveal';
import { useImagePicker } from '../src/hooks/useImagePicker';
import { useResemble } from '../src/context/ResembleContext';
import { useAnalysis } from '../src/hooks/useAnalysis';
import type { ComparisonResult } from '../src/engine';

type FamilySlot = 'parent1' | 'child' | 'parent2';
const FAMILY_SLOTS: FamilySlot[] = ['parent1', 'child', 'parent2'];

const LOADING_MESSAGES = [
  'Warming up the AI...',
  'Mapping facial geometry...',
  'Loading landmark model...',
  'Almost ready...',
];

const familyInsights: Record<string, { high: string; med: string; low: string }> = {
  eyes: { high: "Those eyes are definitely inherited!", med: "Similar eye shape", low: "Unique eye shape" },
  nose: { high: "The nose doesn't lie!", med: "Nose similarities detected", low: "Different nose profile" },
  mouth: { high: "Same smile!", med: "Some lip similarity", low: "Different lip shape" },
  jawline: { high: "Same face shape \u2014 unmistakable", med: "Similar jaw structure", low: "Different face shape" },
  eyebrows: { high: "Those brows run in the family!", med: "Eyebrow similarity", low: "Different brow shape" },
};

function getTopInsight(features: ComparisonResult['features']): string | null {
  if (!features || features.length === 0) return null;
  let best = features[0];
  for (const f of features) {
    const fMax = Math.max(f.scores.parent1 ?? 0, f.scores.parent2 ?? 0);
    const bestMax = Math.max(best.scores.parent1 ?? 0, best.scores.parent2 ?? 0);
    if (fMax > bestMax) best = f;
  }
  const topScore = Math.max(best.scores.parent1 ?? 0, best.scores.parent2 ?? 0);
  const insight = familyInsights[best.key];
  if (!insight) return null;
  if (topScore >= 65) return insight.high;
  if (topScore >= 40) return insight.med;
  return insight.low;
}

export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLg = width >= breakpoints.lg;
  const { images, pickImage, clearSlot, clearAll } = useImagePicker<FamilySlot>(FAMILY_SLOTS);
  const { state, dispatch } = useResemble();
  const { analyze, analyzing, canAnalyze, modelStatus, error } = useAnalysis('family', FAMILY_SLOTS);
  const results = state.results as ComparisonResult | null;

  // Rotating loading messages
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (modelStatus === 'loading') {
      setLoadingMsgIdx(0);
      loadingInterval.current = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    }
    return () => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    };
  }, [modelStatus]);

  // Set mode on mount
  useEffect(() => {
    dispatch({ type: 'SET_MODE', mode: 'family' });
  }, [dispatch]);

  // Consume camera captures when returning from camera screen
  useFocusEffect(
    useCallback(() => {
      if (state.pendingCapture) {
        const { slot, uri } = state.pendingCapture;
        dispatch({ type: 'SET_IMAGE', slot, uri });
        dispatch({ type: 'CONSUME_CAPTURE' });
      }
    }, [state.pendingCapture, dispatch]),
  );

  const hasChild = !!images.child;
  const hasParent = !!(images.parent1 || images.parent2);
  const hasAny = hasChild || !!images.parent1 || !!images.parent2;

  const openCamera = useCallback(
    (slot: FamilySlot) => {
      router.push({ pathname: '/camera', params: { slot, mode: 'family' } });
    },
    [router],
  );

  const handleReset = useCallback(() => {
    clearAll();
    dispatch({ type: 'CLEAR_RESULTS' });
    dispatch({ type: 'CLEAR_ERROR' });
  }, [clearAll, dispatch]);

  // Confetti trigger: overall score > 60%
  const showConfetti = !!(
    results &&
    ((results.overall.parent1 != null && results.overall.parent1 > 60) ||
      (results.overall.parent2 != null && results.overall.parent2 > 60))
  );

  const topInsight = results ? getTopInsight(results.features) : null;

  const hintText = analyzing
    ? 'Computing face similarity scores...'
    : modelStatus === 'loading'
      ? LOADING_MESSAGES[loadingMsgIdx]
      : modelStatus === 'error'
        ? 'Face detection failed to load. Tap Analyze to retry.'
        : !hasChild
          ? "Upload the child's photo to continue"
          : !hasParent
            ? "Upload at least one parent's photo"
            : canAnalyze
              ? 'Ready \u2014 tap Analyze Resemblance'
              : 'Detecting faces in your photos...';

  const uploadSection = (
    <>
      {/* Upload cards */}
      <View style={styles.uploadGrid}>
        <UploadCard
          label="Parent 1"
          color={colors.p1}
          emoji={'\uD83D\uDC64'}
          imageUri={images.parent1}
          detecting={!!state.slots['parent1']?.detecting}
          detectionError={state.slots['parent1']?.detectionError}
          qualityPct={state.slots['parent1']?.quality}
          onPickPhoto={() => pickImage('parent1')}
          onOpenCamera={() => openCamera('parent1')}
          onRemove={() => clearSlot('parent1')}
        />
        <UploadCard
          label="Child"
          color={colors.child}
          emoji={'\uD83D\uDC76'}
          imageUri={images.child}
          highlight
          detecting={!!state.slots['child']?.detecting}
          detectionError={state.slots['child']?.detectionError}
          qualityPct={state.slots['child']?.quality}
          onPickPhoto={() => pickImage('child')}
          onOpenCamera={() => openCamera('child')}
          onRemove={() => clearSlot('child')}
        />
        <UploadCard
          label="Parent 2"
          color={colors.p2}
          emoji={'\uD83D\uDC64'}
          imageUri={images.parent2}
          optional
          detecting={!!state.slots['parent2']?.detecting}
          detectionError={state.slots['parent2']?.detectionError}
          qualityPct={state.slots['parent2']?.quality}
          onPickPhoto={() => pickImage('parent2')}
          onOpenCamera={() => openCamera('parent2')}
          onRemove={() => clearSlot('parent2')}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.ctaRow}>
        <View style={styles.btnGroup}>
          <Button
            title="Analyze Resemblance"
            icon={'\uD83D\uDD2C'}
            onPress={analyze}
            disabled={!canAnalyze}
            loading={analyzing}
            style={{ flex: 1 }}
          />
          <Button
            title="Reset"
            variant="ghost"
            onPress={handleReset}
            disabled={!hasAny}
            style={{ paddingHorizontal: spacing.md }}
          />
        </View>
        <Text style={styles.hint}>{hintText}</Text>
      </View>

      {error && <ErrorBox message={error} />}
    </>
  );

  const resultsSection = (
    <View style={styles.resultsSection}>
      <Text style={styles.resultsTitle}>Family Resemblance Report</Text>
      <Text style={styles.resultsSubtitle}>
        Overall scores are a weighted average of the 5 feature scores below
      </Text>

      {/* Personality insight */}
      {topInsight && (
        <View style={styles.insightBanner}>
          <Text style={styles.insightEmoji}>{'\u2728'}</Text>
          <Text style={styles.insightText}>{topInsight}</Text>
        </View>
      )}

      {/* ScoreReveal handles gauge charts + feature breakdown with staggered animation */}
      {results && (
        <ScoreReveal
          results={results}
          mode="family"
          visible={!!results}
        />
      )}

      {/* Share Results placeholder */}
      {results && (
        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
          <Text style={styles.shareBtnText}>{'\uD83D\uDCE4'} Share Results</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <ConfettiOverlay active={showConfetti} />

      <ComparisonHeader
        title="Family Resemblance"
        subtitle="Upload a child and up to two parents to compare"
        onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
      />

      {isLg ? (
        <View style={styles.responsiveRow}>
          <View style={styles.responsiveLeft}>{uploadSection}</View>
          <View style={styles.responsiveRight}>{results && resultsSection}</View>
        </View>
      ) : (
        <>
          {uploadSection}
          {results && resultsSection}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  responsiveRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  responsiveLeft: {
    flex: 1,
  },
  responsiveRight: {
    flex: 1,
  },
  uploadGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ctaRow: {
    marginBottom: spacing.lg,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  resultsSection: {
    marginTop: spacing.md,
    ...(Platform.OS === 'web'
      ? ({
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 20,
          padding: spacing.lg,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
        } as any)
      : {}),
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  resultsSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  shareBtn: {
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  shareBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
