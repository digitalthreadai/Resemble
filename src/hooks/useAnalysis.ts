/**
 * Shared analysis hook — orchestrates face detection and scoring.
 *
 * Flow:
 *   1. On mount (or when modelStatus is idle), initializes detection service
 *   2. On image upload (SET_IMAGE), eagerly runs face detection
 *   3. On analyze(), validates all slots have landmarks, runs scoring engine
 *
 * ┌──────────────┐   SET_IMAGE    ┌─────────────┐   landmarks   ┌──────────┐
 * │ ImagePicker / │ ────────────► │ Detection   │ ────────────► │ Engine   │
 * │ Camera        │               │ Service     │               │ Scoring  │
 * └──────────────┘               └─────────────┘               └──────────┘
 *                                                                    │
 *                                                              SET_RESULTS
 *                                                                    ▼
 *                                                              ┌──────────┐
 *                                                              │ Results  │
 *                                                              │ UI       │
 *                                                              └──────────┘
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useResemble } from '../context/ResembleContext';
import { computeScores, computeCelebScores, computeAccuracy } from '../engine';
import type { Point2D } from '../engine';
import type { ComparisonMode, SlotData } from '../types';
import faceDetectionService from '../services/faceDetection';
import type { FaceDetectionService } from '../services/faceDetection/types';

export function useAnalysis(mode: ComparisonMode, requiredSlots: string[]) {
  const { state, dispatch } = useResemble();
  const [analyzing, setAnalyzing] = useState(false);
  const serviceRef = useRef<FaceDetectionService | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize detection service lazily on first render of a comparison screen
  useEffect(() => {
    if (state.modelStatus !== 'idle') return;

    dispatch({ type: 'SET_MODEL_STATUS', status: 'loading' });

    const init = async () => {
      try {
        serviceRef.current = faceDetectionService;
        await faceDetectionService.initialize();
        dispatch({ type: 'SET_MODEL_STATUS', status: 'ready' });
      } catch (err: any) {
        console.error('Face detection init failed:', err);
        dispatch({
          type: 'SET_MODEL_STATUS',
          status: 'error',
          error: err.message || 'Failed to load face detection models',
        });
      }
    };

    initPromiseRef.current = init();
  }, [state.modelStatus, dispatch]);

  // Eager face detection: when a slot gets a new image, detect immediately
  useEffect(() => {
    if (state.modelStatus !== 'ready' || !serviceRef.current) return;

    const service = serviceRef.current;

    for (const slotKey of requiredSlots) {
      const slot = state.slots[slotKey];
      if (
        slot &&
        slot.uri &&
        !slot.landmarks &&
        !slot.detecting &&
        !slot.detectionError
      ) {
        // Run detection for this slot
        dispatch({ type: 'SET_DETECTING', slot: slotKey, detecting: true });

        service
          .detectFromImage(slot.uri)
          .then(result => {
            const quality = computeAccuracy(
              result.confidence,
              { width: result.boundingBox.width, height: result.boundingBox.height },
              { width: 640, height: 480 }, // approximate image size
              result.landmarks,
            );

            dispatch({
              type: 'SET_DETECTION',
              slot: slotKey,
              landmarks: result.landmarks,
              descriptor: result.descriptor,
              quality: quality.pct,
              platform: result.platform,
            });
          })
          .catch(err => {
            const errorMsg =
              err.message === 'NO_FACE_DETECTED'
                ? 'No face found in this photo. Try a clearer photo with good lighting.'
                : `Could not process image: ${err.message}`;

            dispatch({
              type: 'SET_DETECTION_ERROR',
              slot: slotKey,
              error: errorMsg,
            });
          });
      }
    }
  }, [state.slots, state.modelStatus, requiredSlots, dispatch]);

  // Run the scoring engine
  const analyze = useCallback(async () => {
    dispatch({ type: 'CLEAR_ERROR' });
    setAnalyzing(true);

    try {
      // Wait for init if still loading
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }

      // Validate all required slots have landmarks
      const missingSlots: string[] = [];
      const errorSlots: string[] = [];

      for (const slotKey of requiredSlots) {
        const slot = state.slots[slotKey];
        if (!slot) continue; // optional slot
        if (slot.detectionError) {
          errorSlots.push(slotKey);
        } else if (!slot.landmarks) {
          missingSlots.push(slotKey);
        }
      }

      if (errorSlots.length > 0) {
        dispatch({
          type: 'SET_ERROR',
          error: `Face detection failed for: ${errorSlots.join(', ')}. Try different photos.`,
        });
        return;
      }

      if (missingSlots.length > 0) {
        dispatch({
          type: 'SET_ERROR',
          error: `Still detecting faces for: ${missingSlots.join(', ')}. Please wait.`,
        });
        return;
      }

      // Enforce same-platform comparison
      const platforms = new Set<string>();
      for (const slotKey of requiredSlots) {
        const slot = state.slots[slotKey];
        if (slot?.platform) platforms.add(slot.platform);
      }
      if (platforms.size > 1) {
        dispatch({
          type: 'SET_ERROR',
          error: 'All photos must be processed on the same platform for accurate comparison.',
        });
        return;
      }

      if (mode === 'family') {
        const childSlot = state.slots['child'];
        if (!childSlot?.landmarks) {
          dispatch({ type: 'SET_ERROR', error: 'Child photo is required.' });
          return;
        }

        const parentLandmarks: Record<string, Point2D[] | null> = {};
        const parentDescriptors: Record<string, Float32Array | number[] | null> = {};
        if (state.slots['parent1']?.landmarks) {
          parentLandmarks['parent1'] = state.slots['parent1'].landmarks;
          parentDescriptors['parent1'] = state.slots['parent1'].descriptor ?? null;
        }
        if (state.slots['parent2']?.landmarks) {
          parentLandmarks['parent2'] = state.slots['parent2'].landmarks;
          parentDescriptors['parent2'] = state.slots['parent2'].descriptor ?? null;
        }

        if (Object.keys(parentLandmarks).length === 0) {
          dispatch({ type: 'SET_ERROR', error: 'At least one parent photo is required.' });
          return;
        }

        const results = computeScores(
          childSlot.landmarks,
          parentLandmarks,
          childSlot.descriptor,
          parentDescriptors,
        );
        dispatch({ type: 'SET_RESULTS', results });
      } else {
        // Celebrity mode
        const youSlot = state.slots['you'];
        const celebSlot = state.slots['celebrity'];

        if (!youSlot?.landmarks || !celebSlot?.landmarks) {
          dispatch({ type: 'SET_ERROR', error: 'Both photos are required.' });
          return;
        }

        const results = computeCelebScores(
          youSlot.landmarks,
          celebSlot.landmarks,
          youSlot.descriptor ?? undefined,
          celebSlot.descriptor ?? undefined,
        );
        dispatch({ type: 'SET_RESULTS', results });
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message || 'Analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  }, [mode, state.slots, requiredSlots, dispatch]);

  // Determine if we can analyze
  const allSlotsReady = requiredSlots.every(slotKey => {
    const slot = state.slots[slotKey];
    // Slot either has landmarks or doesn't exist (optional)
    return !slot || (slot.landmarks && !slot.detecting);
  });

  const hasRequiredSlots = mode === 'family'
    ? !!state.slots['child']?.landmarks &&
      !!(state.slots['parent1']?.landmarks || state.slots['parent2']?.landmarks)
    : !!state.slots['you']?.landmarks && !!state.slots['celebrity']?.landmarks;

  const canAnalyze =
    state.modelStatus === 'ready' &&
    allSlotsReady &&
    hasRequiredSlots &&
    !analyzing;

  return {
    analyze,
    analyzing,
    canAnalyze,
    modelStatus: state.modelStatus,
    modelError: state.modelError,
    results: state.results,
    error: state.error,
  };
}
