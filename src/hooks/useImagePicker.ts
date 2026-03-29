import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useResemble } from '../context/ResembleContext';

/**
 * Thin wrapper around expo-image-picker that dispatches to ResembleContext.
 * Slots and their metadata (URI, landmarks, quality) live in context.
 */
export function useImagePicker<T extends string>(slots: T[]) {
  const { state, dispatch } = useResemble();

  // Build a Record<T, string | null> from context slots for backward compat
  const images = Object.fromEntries(
    slots.map(s => [s, state.slots[s]?.uri ?? null]),
  ) as Record<T, string | null>;

  const pickImage = useCallback(async (slot: T) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      dispatch({ type: 'SET_IMAGE', slot, uri: result.assets[0].uri });
    }
  }, [dispatch]);

  const setImage = useCallback((slot: T, uri: string) => {
    dispatch({ type: 'SET_IMAGE', slot, uri });
  }, [dispatch]);

  const clearSlot = useCallback((slot: T) => {
    dispatch({ type: 'CLEAR_SLOT', slot });
  }, [dispatch]);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, [dispatch]);

  return { images, pickImage, setImage, clearSlot, clearAll };
}
