import { useState, useEffect, useCallback } from 'react';
import {
  loadHistory,
  saveComparison,
  deleteEntry,
  clearAll as clearAllEntries,
  type HistoryEntry,
} from '../services/history';

interface UseHistoryReturn {
  history: HistoryEntry[];
  loading: boolean;
  save: (
    mode: 'family' | 'celebrity',
    scores: Record<string, number>,
    imageUris: string[],
  ) => Promise<HistoryEntry>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const entries = await loadHistory();
      setHistory(entries);
    } catch {
      setHistory([]);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const save = useCallback(
    async (
      mode: 'family' | 'celebrity',
      scores: Record<string, number>,
      imageUris: string[],
    ): Promise<HistoryEntry> => {
      const entry = await saveComparison(mode, scores, imageUris);
      await refresh();
      return entry;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteEntry(id);
      await refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await clearAllEntries();
    setHistory([]);
  }, []);

  return { history, loading, save, remove, clearAll };
}
