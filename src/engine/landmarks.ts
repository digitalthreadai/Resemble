/**
 * Face similarity engine — ported from the original Resemble app.js.
 * Pure math, no platform dependencies.
 */

import { FEATURES, FEATURE_WEIGHTS, type FeatureRegion } from './constants';

export interface Point2D {
  x: number;
  y: number;
}

// ── Math helpers ──────────────────────────────────────────────────────────────

export function centroid(pts: Point2D[]): Point2D {
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

export function dist2d(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function euclideanDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/**
 * Cosine similarity between two vectors.
 * Returns value in [0, 1] where 1 = identical direction.
 * This is the research-backed metric for face embedding comparison.
 */
export function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  // Clamp to [0, 1] — negative cosine similarity means very dissimilar
  return Math.max(0, dot / denom);
}

/**
 * Convert raw cosine similarity (0-1 range, where family resemblance
 * typically falls 0.3-0.6) to a 0-100 user-friendly score.
 *
 * Mapping: 0.2 → 0%, 0.4 → 50%, 0.6 → 80%, 0.8+ → 95-100%
 * This is calibrated for kinship/family resemblance, NOT identity matching.
 */
export function embeddingToScore(cosSim: number): number {
  // Sigmoid-like mapping tuned for family resemblance range
  // Identity matches score >0.8, family typically 0.3-0.6
  const normalized = (cosSim - 0.2) / 0.6; // map 0.2-0.8 → 0-1
  const curved = 1 / (1 + Math.exp(-6 * (normalized - 0.4))); // sigmoid centered at 0.4
  return Math.max(0, Math.min(100, Math.round(curved * 100)));
}

// ── Landmark normalisation ────────────────────────────────────────────────────

/**
 * Translate landmarks so that the mid-eye point is origin, then scale by
 * inter-ocular distance (IOD). This makes the coordinates scale- and
 * position-invariant.
 */
export function normaliseLandmarks(positions: Point2D[]): Point2D[] {
  const rEyeC = centroid(positions.slice(36, 42));
  const lEyeC = centroid(positions.slice(42, 48));
  const iod = dist2d(rEyeC, lEyeC);
  if (iod < 1) return positions;
  const cx = (rEyeC.x + lEyeC.x) / 2;
  const cy = (rEyeC.y + lEyeC.y) / 2;
  return positions.map(p => ({ x: (p.x - cx) / iod, y: (p.y - cy) / iod }));
}

// ── Similarity scoring ────────────────────────────────────────────────────────

/**
 * Compute similarity for a single facial feature region.
 * Returns 0–100 (100 = identical).
 */
export function featureSim(childNorm: Point2D[], parentNorm: Point2D[], indices: number[]): number {
  let total = 0;
  for (const i of indices) {
    total += dist2d(childNorm[i], parentNorm[i]);
  }
  const avgDist = total / indices.length;
  return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-avgDist / 0.12))));
}

/**
 * Weighted average across all features for one parent.
 */
export function overallFromFeatures(
  featureArr: { key: string; scores: Record<string, number | null> }[],
  parent: string,
): number {
  let total = 0;
  let wSum = 0;
  featureArr.forEach(f => {
    const score = f.scores[parent];
    if (score == null) return;
    const w = FEATURE_WEIGHTS[f.key] ?? 0.20;
    total += score * w;
    wSum += w;
  });
  return wSum > 0 ? Math.round(total / wSum) : 0;
}

// ── Full comparison pipeline ──────────────────────────────────────────────────

export interface FeatureScore extends FeatureRegion {
  scores: Record<string, number>;
}

export interface ComparisonResult {
  overall: Record<string, number>;
  features: FeatureScore[];
}

/**
 * Compare a child's landmarks against one or two parents.
 * Uses hybrid scoring: 70% embedding similarity + 30% landmark similarity
 * when descriptors are available. Falls back to pure landmarks otherwise.
 */
export function computeScores(
  childLandmarks: Point2D[],
  parentLandmarks: Record<string, Point2D[] | null>,
  childDescriptor?: Float32Array | number[] | null,
  parentDescriptors?: Record<string, Float32Array | number[] | null>,
): ComparisonResult {
  const childNorm = normaliseLandmarks(childLandmarks);

  const result: ComparisonResult = {
    overall: {},
    features: FEATURES.map(f => ({ ...f, scores: {} })),
  };

  Object.entries(parentLandmarks).forEach(([parentKey, landmarks]) => {
    if (!landmarks) return;
    const parNorm = normaliseLandmarks(landmarks);
    result.features.forEach(f => {
      f.scores[parentKey] = featureSim(childNorm, parNorm, f.indices);
    });
  });

  Object.keys(parentLandmarks).forEach(parentKey => {
    if (!parentLandmarks[parentKey]) return;
    const landmarkScore = overallFromFeatures(result.features, parentKey);

    // Hybrid: 70% embedding + 30% landmark when descriptors available
    const parentDesc = parentDescriptors?.[parentKey];
    if (childDescriptor && parentDesc) {
      const cosSim = cosineSimilarity(childDescriptor, parentDesc);
      const embScore = embeddingToScore(cosSim);
      result.overall[parentKey] = Math.round(0.70 * embScore + 0.30 * landmarkScore);
    } else {
      result.overall[parentKey] = landmarkScore;
    }
  });

  return result;
}

/**
 * Celebrity mode: compare two faces directly.
 * Returns per-feature scores + overall weighted score + descriptor similarity.
 */
export function computeCelebScores(
  yourLandmarks: Point2D[],
  celebLandmarks: Point2D[],
  yourDescriptor?: Float32Array | number[],
  celebDescriptor?: Float32Array | number[],
): {
  overall: number;
  descriptorSimilarity: number;
  features: { key: string; label: string; emoji: string; note: string; score: number }[];
} {
  const youNorm = normaliseLandmarks(yourLandmarks);
  const celebNorm = normaliseLandmarks(celebLandmarks);

  const featureScores = FEATURES.map(f => ({
    key: f.key,
    label: f.label,
    emoji: f.emoji,
    note: f.note,
    score: featureSim(youNorm, celebNorm, f.indices),
  }));

  let total = 0;
  let wSum = 0;
  featureScores.forEach(f => {
    const w = FEATURE_WEIGHTS[f.key] ?? 0.20;
    total += f.score * w;
    wSum += w;
  });
  const overall = wSum > 0 ? Math.round(total / wSum) : 0;

  let descriptorSimilarity = 0;
  if (yourDescriptor && celebDescriptor) {
    const cosSim = cosineSimilarity(yourDescriptor, celebDescriptor);
    descriptorSimilarity = embeddingToScore(cosSim);
  }

  // Hybrid: 70% embedding + 30% landmark when descriptors available
  const finalOverall = (yourDescriptor && celebDescriptor)
    ? Math.round(0.70 * descriptorSimilarity + 0.30 * overall)
    : overall;

  return { overall: finalOverall, descriptorSimilarity, features: featureScores };
}
