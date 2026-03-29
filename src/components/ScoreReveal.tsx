import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { GaugeChart } from './GaugeChart';
import { FeatureBreakdown } from './FeatureBar';
import type { ComparisonResult, FeatureScore } from '../engine';
import { colors } from '../theme/colors';

interface CelebResult {
  overall: number;
  descriptorSimilarity: number;
  features: { key: string; label: string; emoji: string; note: string; score: number }[];
}

interface ScoreRevealProps {
  /** Family mode result or celebrity mode result */
  results?: ComparisonResult | CelebResult;
  mode?: 'family' | 'celebrity';
  /** When visible becomes true, triggers staggered reveal animation */
  visible?: boolean;
  style?: ViewStyle;
  /** Legacy API: wrap children in a fade-up reveal */
  children?: React.ReactNode;
  /** Legacy API: delay before animation starts (ms) */
  delay?: number;
}

/**
 * Orchestrates staggered reveal of score results:
 * 1. Gauge charts fade up (0ms delay)
 * 2. Each feature bar fades up with 150ms stagger
 * 3. Winner badges scale in after bars complete (handled by FeatureBreakdown internally)
 */
export function ScoreReveal({ results, mode, visible, style, children, delay }: ScoreRevealProps) {
  // Legacy children-wrapper mode
  if (children !== undefined) {
    return <LegacyScoreReveal delay={delay ?? 0} style={style}>{children}</LegacyScoreReveal>;
  }
  // Animated values for each section
  const gaugeOpacity = useRef(new Animated.Value(0)).current;
  const gaugeTranslateY = useRef(new Animated.Value(20)).current;

  // One animated pair per feature
  const featureAnims = useRef<{ opacity: Animated.Value; translateY: Animated.Value }[]>([]).current;

  const isFamilyResult = (r: ComparisonResult | CelebResult | undefined): r is ComparisonResult => {
    return !!r && 'features' in r && Array.isArray(r.features) && r.features.length > 0 && 'scores' in r.features[0];
  };

  const featureCount = results?.features.length ?? 0;

  // Ensure we have enough animated values
  while (featureAnims.length < featureCount) {
    featureAnims.push({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    });
  }

  useEffect(() => {
    if (!visible) {
      // Reset
      gaugeOpacity.setValue(0);
      gaugeTranslateY.setValue(20);
      featureAnims.forEach(a => {
        a.opacity.setValue(0);
        a.translateY.setValue(20);
      });
      return;
    }

    // 1. Gauge charts fade up at 0ms
    Animated.parallel([
      Animated.timing(gaugeOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(gaugeTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Each feature section fades up with 150ms stagger (starting after gauges)
    const gaugeDelay = 300; // Start features partway through gauge animation
    featureAnims.slice(0, featureCount).forEach((anim, i) => {
      const delay = gaugeDelay + i * 150;
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [visible]);

  if (!visible || !results) return null;

  if (mode === 'family' && isFamilyResult(results)) {
    const familyResult = results as ComparisonResult;
    const parentKeys = Object.keys(familyResult.overall);

    return (
      <View style={style}>
        {/* Gauge charts */}
        <Animated.View
          style={[
            styles.gaugeRow,
            {
              opacity: gaugeOpacity,
              transform: [{ translateY: gaugeTranslateY }],
            },
          ]}
        >
          {parentKeys.map((pKey) => (
            <GaugeChart
              key={pKey}
              label={pKey === 'p1' ? 'Parent 1' : 'Parent 2'}
              percentage={familyResult.overall[pKey]}
              color={pKey === 'p1' ? colors.p1 : colors.p2}
            />
          ))}
        </Animated.View>

        {/* Feature breakdowns */}
        {familyResult.features.map((feat, i) => {
          const anim = featureAnims[i];
          const bars = parentKeys.map(pKey => ({
            label: pKey === 'p1' ? 'Parent 1' : 'Parent 2',
            percentage: feat.scores[pKey] ?? 0,
            color: pKey === 'p1' ? colors.p1 : colors.p2,
          }));
          const p1Score = feat.scores['p1'] ?? 0;
          const p2Score = feat.scores['p2'] ?? 0;
          const winner =
            parentKeys.length < 2
              ? null
              : Math.abs(p1Score - p2Score) < 5
                ? 'tie'
                : p1Score > p2Score
                  ? 'p1'
                  : 'p2';

          return (
            <Animated.View
              key={feat.key}
              style={{
                opacity: anim.opacity,
                transform: [{ translateY: anim.translateY }],
              }}
            >
              <FeatureBreakdown
                emoji={feat.emoji}
                label={feat.label}
                note={feat.note}
                bars={bars}
                winner={winner}
                baseIndex={i * 2}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  }

  // Celebrity mode
  const celebResult = results as CelebResult;
  return (
    <View style={style}>
      {/* Gauge chart */}
      <Animated.View
        style={[
          styles.gaugeRow,
          {
            opacity: gaugeOpacity,
            transform: [{ translateY: gaugeTranslateY }],
          },
        ]}
      >
        <GaugeChart
          label="Overall Match"
          percentage={celebResult.overall}
          color={colors.celeb}
        />
        {celebResult.descriptorSimilarity > 0 && (
          <GaugeChart
            label="Face Recognition"
            percentage={celebResult.descriptorSimilarity}
            color={colors.you}
          />
        )}
      </Animated.View>

      {/* Feature breakdowns */}
      {celebResult.features.map((feat, i) => {
        const anim = featureAnims[i];
        return (
          <Animated.View
            key={feat.key}
            style={{
              opacity: anim.opacity,
              transform: [{ translateY: anim.translateY }],
            }}
          >
            <FeatureBreakdown
              emoji={feat.emoji}
              label={feat.label}
              note={feat.note}
              bars={[
                {
                  label: 'Match',
                  percentage: feat.score,
                  color: colors.celeb,
                },
              ]}
              baseIndex={i}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Legacy wrapper: simple fade-up reveal for arbitrary children */
function LegacyScoreReveal({ children, delay = 0, style: legacyStyle }: { children: React.ReactNode; delay: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={[legacyStyle, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
});
