import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { useCelebrities } from '../hooks/useCelebrities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = spacing.md;
const CELL_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP) / 2;

interface CelebrityBrowserProps {
  onSelect: (imageUrl: string) => void;
}

export function CelebrityBrowser({ onSelect }: CelebrityBrowserProps) {
  const { search, results, loading, error, select, selectedUrl } =
    useCelebrities();

  const handleSelect = (url: string) => {
    select(url);
    onSelect(url);
  };

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a celebrity..."
          placeholderTextColor={colors.textMuted}
          onChangeText={search}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* States */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>Searching...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={40} color={colors.error} />
          <Text style={styles.errorText}>Could not find celebrity photos</Text>
          <Text style={styles.errorSub}>{error}</Text>
        </View>
      )}

      {!loading && !error && results.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="people" size={48} color={colors.textMuted} />
          <Text style={styles.statusText}>
            Search for a celebrity to compare
          </Text>
        </View>
      )}

      {/* Results grid */}
      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          keyExtractor={(item, i) => `${item.imageUrl}-${i}`}
          renderItem={({ item }) => {
            const isSelected = item.imageUrl === selectedUrl;
            return (
              <TouchableOpacity
                style={[styles.cell, isSelected && styles.cellSelected]}
                onPress={() => handleSelect(item.imageUrl)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.cellImage}
                  resizeMode="cover"
                />
                {/* Overlay */}
                <View style={styles.cellOverlay}>
                  <Text style={styles.cellName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cellSource}>{item.source}</Text>
                </View>
                {/* Selected checkmark */}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Shimmer placeholders while loading */}
      {loading && (
        <View style={styles.shimmerGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.shimmerCell} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Inter',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  statusText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  errorSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  cell: {
    width: CELL_WIDTH,
    height: CELL_WIDTH * 1.3,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: colors.primary,
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cellName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  cellSource: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  shimmerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: spacing.lg,
  },
  shimmerCell: {
    width: CELL_WIDTH,
    height: CELL_WIDTH * 1.3,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    opacity: 0.6,
  },
});
