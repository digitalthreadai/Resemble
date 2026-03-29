import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  Swipeable,
} from 'react-native-gesture-handler';
import { colors } from '../src/theme/colors';
import { spacing, radius, maxContentWidth } from '../src/theme/spacing';
import { useHistory } from '../src/hooks/useHistory';
import { HistoryCard } from '../src/components/HistoryCard';
import type { HistoryEntry } from '../src/services/history';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, loading, remove, clearAll } = useHistory();
  const openSwipeableRef = useRef<Swipeable | null>(null);

  const handleClearAll = useCallback(() => {
    if (Platform.OS === 'web') {
      clearAll();
      return;
    }
    Alert.alert(
      'Clear History',
      'Delete all comparison history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => clearAll() },
      ],
    );
  }, [clearAll]);

  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      _dragX: Animated.AnimatedInterpolation<number>,
    ) => (
      <TouchableOpacity style={styles.deleteAction}>
        <Ionicons name="trash-outline" size={22} color={colors.text} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: HistoryEntry }) => {
      const onSwipeOpen = (direction: string, swipeable: Swipeable) => {
        if (direction === 'right') {
          if (openSwipeableRef.current && openSwipeableRef.current !== swipeable) {
            openSwipeableRef.current.close();
          }
          openSwipeableRef.current = swipeable;
          remove(item.id);
        }
      };

      return (
        <Swipeable
          renderRightActions={renderRightActions}
          onSwipeableWillOpen={(direction) => {}}
          onSwipeableOpen={(direction, swipeable) => onSwipeOpen(direction, swipeable)}
          rightThreshold={80}
          overshootRight={false}
        >
          <View style={styles.itemWrap}>
            <HistoryCard entry={item} />
          </View>
        </Swipeable>
      );
    },
    [remove, renderRightActions],
  );

  const keyExtractor = useCallback((item: HistoryEntry) => item.id, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>History</Text>
          <View style={styles.headerSpacer} />
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Comparisons Yet</Text>
            <Text style={styles.emptyText}>
              Your comparison results will appear here after you run your first analysis.
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  headerSpacer: {
    flex: 0,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  clearText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  itemWrap: {
    backgroundColor: colors.bg,
  },
  separator: {
    height: spacing.sm,
  },
  deleteAction: {
    backgroundColor: colors.error,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    marginLeft: spacing.sm,
    gap: 4,
  },
  deleteText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
