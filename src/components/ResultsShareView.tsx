import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { FEATURES, FEATURE_WEIGHTS } from '../engine/constants';
import type { ComparisonResult } from '../engine';

interface ResultsShareViewProps {
  mode: 'family' | 'celebrity';
  result: ComparisonResult;
  imageUris: string[];
}

const CARD_WIDTH = 1080;
const GAUGE_SIZE = 180;

function StaticGauge({ percentage, color, label }: { percentage: number; color: string; label: string }) {
  const r = (GAUGE_SIZE - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percentage / 100);

  return (
    <View style={shareStyles.gauge}>
      <Text style={shareStyles.gaugeLabel}>{label}</Text>
      <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}>
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={12}
            fill="none"
          />
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={r}
            stroke={color}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
          />
        </Svg>
        <View style={[shareStyles.gaugePctWrap, { width: GAUGE_SIZE, height: GAUGE_SIZE }]}>
          <Text style={shareStyles.gaugePct}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    </View>
  );
}

function StaticFeatureBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <View style={shareStyles.barRow}>
      <Text style={[shareStyles.barLabel, { color }]}>{label}</Text>
      <View style={shareStyles.barTrack}>
        <View style={[shareStyles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={[shareStyles.barPct, { color }]}>{percentage}%</Text>
    </View>
  );
}

/**
 * Off-screen branded card captured for sharing.
 * Rendered at 1080px wide for high-res export.
 */
export function ResultsShareView({ mode, result, imageUris }: ResultsShareViewProps) {
  const modeLabel = mode === 'family' ? 'Family Resemblance' : 'Celebrity Match';

  return (
    <View style={shareStyles.card}>
      {/* Header */}
      <View style={shareStyles.header}>
        <View style={shareStyles.modeBadge}>
          <Text style={shareStyles.modeBadgeText}>{modeLabel}</Text>
        </View>
      </View>

      {/* Thumbnails */}
      <View style={shareStyles.thumbRow}>
        {imageUris.filter(Boolean).map((uri, i) => {
          const slotColors = mode === 'family'
            ? [colors.p1, colors.child, colors.p2]
            : [colors.you, colors.celeb];
          return (
            <Image
              key={i}
              source={{ uri }}
              style={[shareStyles.thumb, { borderColor: slotColors[i % slotColors.length] }]}
            />
          );
        })}
      </View>

      {/* Gauges */}
      <View style={shareStyles.gaugeRow}>
        {Object.entries(result.overall).map(([key, value]) => {
          const colorMap: Record<string, string> = {
            parent1: colors.p1,
            parent2: colors.p2,
            celebrity: colors.celeb,
          };
          const labelMap: Record<string, string> = {
            parent1: 'vs Parent 1',
            parent2: 'vs Parent 2',
            celebrity: 'Match Score',
          };
          return (
            <StaticGauge
              key={key}
              percentage={value}
              color={colorMap[key] ?? colors.primary}
              label={labelMap[key] ?? key}
            />
          );
        })}
      </View>

      {/* Feature bars */}
      <View style={shareStyles.featuresCard}>
        <Text style={shareStyles.featuresTitle}>Feature Breakdown</Text>
        {result.features.map(f => (
          <View key={f.key} style={shareStyles.featureGroup}>
            <Text style={shareStyles.featureName}>{f.label}</Text>
            {Object.entries(f.scores).map(([key, value]) => {
              const barColor = key === 'parent1' ? colors.p1
                : key === 'parent2' ? colors.p2
                : key === 'celebrity' ? colors.celeb
                : colors.primary;
              return (
                <StaticFeatureBar
                  key={key}
                  label={key === 'parent1' ? 'P1' : key === 'parent2' ? 'P2' : key}
                  percentage={value}
                  color={barColor}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer branding */}
      <View style={shareStyles.footer}>
        <Text style={shareStyles.footerText}>Resemble</Text>
        <Text style={shareStyles.footerSub}>AI Face Comparison</Text>
      </View>
    </View>
  );
}

const shareStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.bg,
    padding: 60,
    borderRadius: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  modeBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modeBadgeText: {
    color: colors.primaryLight,
    fontSize: 22,
    fontWeight: '700',
  },
  thumbRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  thumb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    backgroundColor: '#1a1a2e',
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 40,
  },
  gauge: {
    alignItems: 'center',
  },
  gaugeLabel: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  gaugePctWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePct: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
  featuresCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 36,
    marginBottom: 40,
  },
  featuresTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  featureGroup: {
    marginBottom: 16,
  },
  featureName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  barLabel: {
    width: 80,
    fontSize: 16,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barPct: {
    width: 56,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  footerSub: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
});
