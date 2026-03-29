import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { spacing, radius, maxContentWidth, breakpoints } from '../src/theme/spacing';
import { fontFamily } from '../src/theme/fonts';

const isWeb = Platform.OS === 'web';

const FEATURE_CARDS = [
  {
    route: '/family' as const,
    icon: 'people' as const,
    color: colors.child,
    gradientStart: '#059669',
    gradientEnd: '#10b981',
    title: 'Family Resemblance',
    desc: 'Upload photos of a child and up to two parents. See which parent each feature comes from with detailed breakdown and inheritance summary.',
    cta: 'Get Started',
  },
  {
    route: '/celebrity' as const,
    icon: 'star' as const,
    color: colors.celeb,
    gradientStart: '#f59e0b',
    gradientEnd: '#fbbf24',
    title: 'Celebrity Match',
    desc: 'Compare your face with any celebrity. Upload both photos and discover your resemblance percentage with feature-by-feature analysis.',
    cta: 'Try It',
  },
  {
    route: '/history' as const,
    icon: 'time' as const,
    color: colors.primary,
    gradientStart: '#7c3aed',
    gradientEnd: '#6366f1',
    title: 'Comparison History',
    desc: 'View your past face comparisons and results.',
    cta: 'View History',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMd = width >= breakpoints.md;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      {/* Hero with background glow */}
      <View style={styles.hero}>
        {/* Deep purple radial gradient background */}
        <View style={styles.heroGlow} />
        <View style={styles.heroGlowSecondary} />

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>AI-Powered Face Analysis</Text>
        </View>

        <Text
          style={[
            styles.heroTitle,
            isWeb && { fontFamily: fontFamily.display, letterSpacing: -2 },
          ]}
        >
          Discover Your{'\n'}
          <Text style={styles.gradientText}>Facial Resemblance</Text>
        </Text>

        <Text style={styles.heroSub}>
          Compare facial features with family members or celebrities using advanced
          AI landmark detection. 68-point analysis, 100% private.
        </Text>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => router.push('/family')}
          >
            <Text style={styles.btnText}>Family Comparison</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => router.push('/celebrity')}
          >
            <Text style={styles.btnTextSecondary}>Celebrity Match</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row as glass cards */}
        <View style={styles.statsRow}>
          {[
            { num: '68', label: 'Facial\nLandmarks' },
            { num: '5', label: 'Feature\nRegions' },
            { num: '128D', label: 'Face\nDescriptor' },
            { num: '0', label: 'Data\nUploaded' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feature cards */}
      <Text style={styles.sectionTitle}>Choose Your Comparison</Text>
      <Text style={styles.sectionSub}>Two powerful ways to discover facial resemblance</Text>

      <View style={isMd ? styles.featureGrid : undefined}>
        {FEATURE_CARDS.map((card) => (
          <TouchableOpacity
            key={card.route}
            style={[styles.featureCard, isMd && styles.featureCardGrid]}
            onPress={() => router.push(card.route)}
            activeOpacity={0.7}
            {...(isWeb ? { className: 'hover-lift' } : {})}
          >
            {/* Gradient left border */}
            <View
              style={[
                styles.featureCardBorder,
                { backgroundColor: card.gradientStart },
              ]}
            />
            <View style={styles.featureCardContent}>
              <View style={[styles.featureIcon, { backgroundColor: `${card.color}20` }]}>
                <Ionicons name={card.icon} size={28} color={card.color} />
              </View>
              <Text style={styles.featureTitle}>{card.title}</Text>
              <Text style={styles.featureDesc}>{card.desc}</Text>
              <Text style={styles.featureCta}>{card.cta} {'\u2192'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Privacy banner as glass pills */}
      <View style={styles.privacyBanner}>
        {[
          { icon: 'lock-closed' as const, text: '100% Private' },
          { icon: 'phone-portrait' as const, text: 'Works Offline' },
          { icon: 'flash' as const, text: 'Instant Results' },
          { icon: 'sparkles' as const, text: 'AI-Powered' },
        ].map((item, i) => (
          <View key={i} style={styles.privacyPill}>
            <Ionicons name={item.icon} size={14} color={colors.primary} />
            <Text style={styles.privacyText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Built with face-api.js + Vision Camera{'\n'}DigitalThread AI
      </Text>
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
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: spacing.xl,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124,58,237,0.30)',
    ...(isWeb
      ? ({ filter: 'blur(100px)' } as any)
      : {}),
  },
  heroGlowSecondary: {
    position: 'absolute',
    top: 20,
    right: '10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99,102,241,0.20)',
    ...(isWeb
      ? ({ filter: 'blur(80px)' } as any)
      : {}),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  badgeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 54,
    marginBottom: spacing.md,
  },
  gradientText: {
    color: colors.primaryLight,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    maxWidth: 520,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    minWidth: 150,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextSecondary: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...(isWeb
      ? ({
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },
  statNum: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...(isWeb
      ? ({
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
        } as any)
      : {}),
  },
  featureCardGrid: {
    flex: 1,
    minWidth: 280,
  },
  featureCardBorder: {
    width: 4,
  },
  featureCardContent: {
    flex: 1,
    padding: spacing.lg + 4,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  featureDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  featureCta: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  privacyText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
