import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStepsProps {
  onComplete: () => void;
}

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  content?: React.ReactNode;
}

export function OnboardingSteps({ onComplete }: OnboardingStepsProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const steps: Step[] = [
    {
      icon: 'sparkles',
      title: 'Welcome to Resemble',
      subtitle: 'Discover facial similarities with AI-powered analysis',
    },
    {
      icon: 'scan',
      title: 'How It Works',
      subtitle: '',
      content: <HowItWorksContent />,
    },
    {
      icon: 'shield-checkmark',
      title: 'Your Privacy Matters',
      subtitle: '',
      content: <PrivacyContent />,
    },
    {
      icon: 'camera',
      title: 'Tips for Best Results',
      subtitle: '',
      content: <TipsContent />,
    },
  ];

  const isLast = activeIndex === steps.length - 1;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / SCREEN_WIDTH);
      setActiveIndex(index);
    },
    [],
  );

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    const next = activeIndex + 1;
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setActiveIndex(next);
  }, [activeIndex, isLast, onComplete]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {steps.map((step, i) => (
          <View key={i} style={styles.page}>
            <View style={styles.iconWrap}>
              <Ionicons name={step.icon} size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>{step.title}</Text>
            {step.subtitle ? (
              <Text style={styles.subtitle}>{step.subtitle}</Text>
            ) : null}
            {step.content ?? null}
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Step 2: How It Works ── */
function HowItWorksContent() {
  const cards = [
    { icon: 'camera-outline' as const, label: 'Take photos' },
    { icon: 'git-compare-outline' as const, label: 'AI maps landmarks' },
    { icon: 'stats-chart-outline' as const, label: 'Get scores' },
  ];

  return (
    <View style={styles.miniCards}>
      {cards.map((c, i) => (
        <View key={i} style={styles.miniCard}>
          <Ionicons name={c.icon} size={28} color={colors.primary} />
          <Text style={styles.miniCardLabel}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Step 3: Privacy ── */
function PrivacyContent() {
  const bullets = [
    'All analysis runs on your device',
    'Photos are never uploaded to any server',
    'No account or sign-up required',
  ];

  return (
    <View style={styles.bullets}>
      {bullets.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.success}
          />
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Step 4: Tips ── */
function TipsContent() {
  const tips = [
    'Face the camera directly',
    'Ensure good, even lighting',
    'Remove glasses if possible',
    'Keep a neutral expression',
  ];

  return (
    <View style={styles.bullets}>
      {tips.map((t, i) => (
        <View key={i} style={styles.bulletRow}>
          <Ionicons name="bulb-outline" size={20} color={colors.celeb} />
          <Text style={styles.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    fontFamily: 'Inter',
  },

  /* Mini cards (How It Works) */
  miniCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  miniCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    width: 100,
    gap: spacing.sm,
  },
  miniCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontFamily: 'Inter',
  },

  /* Bullet lists */
  bullets: {
    marginTop: spacing.xl,
    gap: spacing.md,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    fontFamily: 'Inter',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80,
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: '#7c3aed',
    width: 24,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
});
