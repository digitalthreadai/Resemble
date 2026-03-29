import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import type { HistoryEntry } from '../services/history';

interface HistoryCardProps {
  entry: HistoryEntry;
}

const THUMB_SIZE = 44;
const OVERLAP = 14;

/** Border color per slot index — matches the app's slot color scheme. */
const SLOT_COLORS: Record<string, string[]> = {
  family: [colors.p1, colors.child, colors.p2],
  celebrity: [colors.you, colors.celeb],
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getMainScore(entry: HistoryEntry): number {
  const vals = Object.values(entry.scores);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function HistoryCard({ entry }: HistoryCardProps) {
  const slotColors = SLOT_COLORS[entry.mode] ?? [colors.primary];
  const mainScore = getMainScore(entry);
  const modeLabel = entry.mode === 'family' ? 'Family' : 'Celebrity';

  return (
    <View style={styles.card}>
      {/* Overlapping thumbnails */}
      <View style={[styles.thumbRow, { width: THUMB_SIZE + (entry.thumbnailPaths.length - 1) * (THUMB_SIZE - OVERLAP) }]}>
        {entry.thumbnailPaths.map((path, i) => (
          <Image
            key={path}
            source={{ uri: path }}
            style={[
              styles.thumb,
              {
                left: i * (THUMB_SIZE - OVERLAP),
                zIndex: entry.thumbnailPaths.length - i,
                borderColor: slotColors[i % slotColors.length],
              },
            ]}
          />
        ))}
        {entry.thumbnailPaths.length === 0 && (
          <View style={[styles.thumbPlaceholder, { borderColor: slotColors[0] }]}>
            <Text style={styles.thumbPlaceholderText}>?</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={[styles.modeBadge, entry.mode === 'family' ? styles.modeBadgeFamily : styles.modeBadgeCeleb]}>
            <Text style={[styles.modeBadgeText, entry.mode === 'family' ? styles.modeBadgeFamilyText : styles.modeBadgeCelebText]}>
              {modeLabel}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</Text>
        </View>
        <View style={styles.scoreRow}>
          {Object.entries(entry.scores).map(([key, value]) => (
            <Text key={key} style={styles.scoreDetail}>
              {key}: {value}%
            </Text>
          ))}
        </View>
      </View>

      {/* Score badge */}
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{mainScore}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  thumbRow: {
    height: THUMB_SIZE,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    backgroundColor: '#1a1a2e',
  },
  thumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeFamily: {
    backgroundColor: 'rgba(5,150,105,0.15)',
  },
  modeBadgeCeleb: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeBadgeFamilyText: {
    color: colors.child,
  },
  modeBadgeCelebText: {
    color: colors.celeb,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 11,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoreDetail: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
});
