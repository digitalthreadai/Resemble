/**
 * Shared type definitions for Resemble.
 */

import type { Point2D, ComparisonResult } from '../engine';

/** Per-slot detection metadata */
export interface SlotData {
  uri: string;
  landmarks: Point2D[] | null;
  descriptor: Float32Array | null;
  quality: number | null; // 0-100
  detecting: boolean;
  detectionError: string | null;
  platform: 'web' | 'native' | null;
}

/** Result from the face detection service */
export interface FaceDetectionResult {
  landmarks: Point2D[]; // 68 points, dlib order
  descriptor: Float32Array | null; // 128D (web only for now)
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  platform: 'web' | 'native';
}

/** Celebrity match result shape */
export interface CelebResult {
  overall: number;
  descriptorSimilarity: number;
  features: { key: string; label: string; emoji: string; note: string; score: number }[];
}

/** Pending camera capture awaiting consumption by parent screen */
export interface PendingCapture {
  slot: string;
  uri: string;
}

/** Model loading status */
export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Comparison mode */
export type ComparisonMode = 'family' | 'celebrity';

/** History entry persisted to AsyncStorage */
export interface HistoryEntry {
  id: string;
  mode: ComparisonMode;
  timestamp: number;
  scores: {
    overall: Record<string, number> | number;
    descriptorSimilarity?: number;
  };
  thumbnailPaths: string[];
}

/**
 * Global app state managed by ResembleContext.
 *
 * ┌──────────────┐      dispatch(SET_IMAGE)     ┌────────────────┐
 * │  Camera /    │ ──────────────────────────► │ ResembleState  │
 * │  ImagePicker │                              │  .slots[key]   │
 * └──────────────┘                              └────────────────┘
 *                                                       │
 *       dispatch(SET_DETECTION)                         │
 *       ◄────────── faceDetection service ◄─────────────┘
 *                                                       │
 *       dispatch(SET_RESULTS)                           │
 *       ◄────────── useAnalysis hook ◄──────────────────┘
 */
export interface ResembleState {
  mode: ComparisonMode | null;
  slots: Record<string, SlotData | null>;
  pendingCapture: PendingCapture | null;
  modelStatus: ModelStatus;
  modelError: string | null;
  results: ComparisonResult | CelebResult | null;
  error: string | null;
}
