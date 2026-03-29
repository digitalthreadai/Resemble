import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { spacing, radius, maxContentWidth, breakpoints } from '../src/theme/spacing';
import { UploadCard } from '../src/components/UploadCard';
import { Button } from '../src/components/Button';
import { ComparisonHeader } from '../src/components/ComparisonHeader';
import { ErrorBox } from '../src/components/ErrorBox';
import { ConfettiOverlay } from '../src/components/ConfettiOverlay';
import { ScoreReveal } from '../src/components/ScoreReveal';
import { useImagePicker } from '../src/hooks/useImagePicker';
import { useResemble } from '../src/context/ResembleContext';
import { useAnalysis } from '../src/hooks/useAnalysis';
import type { CelebResult } from '../src/types';

type CelebSlot = 'you' | 'celebrity';
const CELEB_SLOTS: CelebSlot[] = ['you', 'celebrity'];

const LOADING_MESSAGES = [
  'Warming up the AI...',
  'Mapping facial geometry...',
  'Loading landmark model...',
  'Almost ready...',
];

function getScoreReaction(pct: number): string {
  if (pct > 80) return 'Uncanny! You could be twins!';
  if (pct > 65) return 'Strong match \u2014 people must tell you this!';
  if (pct > 50) return 'Solid resemblance \u2014 we see it!';
  if (pct > 35) return 'Some similarities in the details';
  return 'Unique look \u2014 be proud of it!';
}

export default function CelebrityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLg = width >= breakpoints.lg;
  const { images, pickImage, clearSlot, clearAll } = useImagePicker<CelebSlot>(CELEB_SLOTS);
  const { state, dispatch } = useResemble();
  const { analyze, analyzing, canAnalyze, modelStatus, error } = useAnalysis('celebrity', CELEB_SLOTS);
  const results = state.results as CelebResult | null;

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
    dispatch({ type: 'SET_MODE', mode: 'celebrity' });
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

  const hasYou = !!images.you;
  const hasCeleb = !!images.celebrity;
  const hasAny = hasYou || hasCeleb;

  const openCamera = useCallback(
    (slot: CelebSlot) => {
      router.push({ pathname: '/camera', params: { slot, mode: 'celeb' } });
    },
    [router],
  );

  const handleReset = useCallback(() => {
    clearAll();
    dispatch({ type: 'CLEAR_RESULTS' });
    dispatch({ type: 'CLEAR_ERROR' });
  }, [clearAll, dispatch]);

  // Confetti trigger: overall score > 60%
  const showConfetti = !!(results && results.overall > 60);

  const hintText = analyzing
    ? 'Computing face similarity scores...'
    : modelStatus === 'loading'
      ? LOADING_MESSAGES[loadingMsgIdx]
      : !hasYou
        ? 'Upload your photo to continue'
        : !hasCeleb
          ? "Upload the celebrity's photo"
          : canAnalyze
            ? 'Ready \u2014 tap Compare Faces'
            : 'Detecting faces in your photos...';

  const uploadSection = (
    <>
      {/* Upload cards */}
      <View style={styles.uploadGrid}>
        <UploadCard
          label="Your Photo"
          color={colors.you}
          emoji={'\uD83E\uDDD1'}
          imageUri={images.you}
          highlight
          detecting={!!state.slots['you']?.detecting}
          detectionError={state.slots['you']?.detectionError}
          qualityPct={state.slots['you']?.quality}
          onPickPhoto={() => pickImage('you')}
          onOpenCamera={() => openCamera('you')}
          onRemove={() => clearSlot('you')}
        />
        <UploadCard
          label="Celebrity"
          color={colors.celeb}
          emoji={'\u2B50'}
          imageUri={images.celebrity}
          detecting={!!state.slots['celebrity']?.detecting}
          detectionError={state.slots['celebrity']?.detectionError}
          qualityPct={state.slots['celebrity']?.quality}
          onPickPhoto={() => pickImage('celebrity')}
          onOpenCamera={() => openCamera('celebrity')}
          onRemove={() => clearSlot('celebrity')}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.ctaRow}>
        <View style={styles.btnGroup}>
          <Button
            title="Compare Faces"
            icon={'\u2B50'}
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

  const resultsSection = results ? (
    <View style={styles.resultsSection}>
      <Text style={styles.resultsTitle}>Celebrity Match Report</Text>
      <Text style={styles.resultsSubtitle}>
        Landmark-based analysis with 128-dimension face descriptor comparison
      </Text>

      {/* Score reaction text */}
      <View style={styles.reactionBanner}>
        <Text style={styles.reactionEmoji}>{results.overall > 65 ? '\uD83C\uDF1F' : '\u2728'}</Text>
        <Text style={styles.reactionText}>{getScoreReaction(results.overall)}</Text>
      </View>

      {/* ScoreReveal handles gauge charts + feature breakdown with staggered animation */}
      <ScoreReveal
        results={results}
        mode="celebrity"
        visible={!!results}
      />

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Match Summary</Text>
        <Text style={styles.summaryText}>
          Your overall resemblance is {results.overall}% based on facial landmarks and{' '}
          {results.descriptorSimilarity}% based on the neural face descriptor.
        </Text>
        <View style={styles.pillRow}>
          {results.features.map(f => {
            const label =
              f.score >= 60 ? 'Similar' : f.score >= 40 ? 'Moderate' : 'Different';
            const pillColor =
              f.score >= 60 ? colors.p1 : f.score >= 40 ? colors.child : colors.p2;
            return (
              <View
                key={f.key}
                style={[styles.pill, { backgroundColor: `${pillColor}20` }]}
              >
                <Text style={[styles.pillText, { color: pillColor }]}>
                  {f.emoji} {f.label}: {f.score}% ({label})
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Share Results placeholder */}
      <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
        <Text style={styles.shareBtnText}>{'\uD83D\uDCE4'} Share Results</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <ConfettiOverlay active={showConfetti} />

      <ComparisonHeader
        title="Celebrity Match"
        subtitle="Compare your face with any celebrity"
        onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
      />

      {isLg ? (
        <View style={styles.responsiveRow}>
          <View style={styles.responsiveLeft}>{uploadSection}</View>
          <View style={styles.responsiveRight}>{resultsSection}</View>
        </View>
      ) : (
        <>
          {uploadSection}
          {resultsSection}
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
  reactionBanner: {
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
  reactionEmoji: {
    fontSize: 20,
  },
  reactionText: {
    color: colors.celeb,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
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
