import { useState, useRef, useCallback } from 'react';
import {
  searchCelebrity,
  type CelebrityResult,
} from '../services/celebritySearch';

export function useCelebrities() {
  const [results, setResults] = useState<CelebrityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Debounce timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache per query for this session
  const cacheRef = useRef<Record<string, CelebrityResult[]>>({});

  const search = useCallback((query: string) => {
    // Clear previous debounce
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      const key = trimmed.toLowerCase();

      // In-memory cache hit
      if (cacheRef.current[key]) {
        setResults(cacheRef.current[key]);
        setLoading(false);
        return;
      }

      try {
        const data = await searchCelebrity(trimmed);
        cacheRef.current[key] = data;
        setResults(data);
        setError(null);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(msg);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const select = useCallback((url: string) => {
    setSelectedUrl((prev) => (prev === url ? null : url));
  }, []);

  return { search, results, loading, error, select, selectedUrl };
}
