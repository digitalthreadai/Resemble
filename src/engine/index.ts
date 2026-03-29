export { FEATURES, FEATURE_WEIGHTS, type FeatureRegion } from './constants';
export {
  type Point2D,
  centroid,
  dist2d,
  euclideanDistance,
  cosineSimilarity,
  embeddingToScore,
  normaliseLandmarks,
  featureSim,
  overallFromFeatures,
  computeScores,
  computeCelebScores,
  type ComparisonResult,
  type FeatureScore,
} from './landmarks';
export { computeAccuracy, assessCameraQuality, type AccuracyResult } from './accuracy';
