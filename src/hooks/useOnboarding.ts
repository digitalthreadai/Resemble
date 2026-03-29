import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'resemble_onboarded';

export function useOnboarding() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        setHasOnboarded(value === 'true');
      } catch {
        // If storage fails, assume not onboarded
        setHasOnboarded(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      setHasOnboarded(true);
    } catch {
      // Best-effort; still mark local state so the user can proceed
      setHasOnboarded(true);
    }
  }, []);

  return { hasOnboarded, loading, completeOnboarding };
}
