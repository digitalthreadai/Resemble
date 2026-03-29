/**
 * Photo quality / accuracy scoring — ported from the original Resemble app.js.
 */

import { centroid, dist2d, type Point2D } from './landmarks';

export interface AccuracyResult {
  pct: number;
  factors: {
    confidence: number;
    size: number;
    roll: number;
    yaw: number;
  };
  tips: string[];
}

/**
 * Assess how good a photo is for face comparison.
 * Takes SSD confidence, face bounding box, and 68 landmarks.
 */
export function computeAccuracy(
  confidence: number,
  faceBox: { width: number; height: number },
  imageSize: { width: number; height: number },
  landmarks: Point2D[],
): AccuracyResult {
  const imgArea = imageSize.width * imageSize.height;
  const faceArea = faceBox.width * faceBox.height;
  const sizeScore = Math.min(1, faceArea / imgArea / 0.09);

  const rEyeC = centroid(landmarks.slice(36, 42));
  const lEyeC = centroid(landmarks.slice(42, 48));
  const tiltDeg = Math.abs(
    Math.atan2(lEyeC.y - rEyeC.y, lEyeC.x - rEyeC.x) * (180 / Math.PI),
  );
  const rollScore = Math.max(0, 1 - tiltDeg / 25);

  const noseTip = landmarks[30];
  const eyeMidX = (rEyeC.x + lEyeC.x) / 2;
  const yawNorm = Math.abs(noseTip.x - eyeMidX) / Math.max(1, faceBox.width);
  const yawScore = Math.max(0, 1 - yawNorm / 0.15);

  const total = confidence * 0.20 + sizeScore * 0.30 + rollScore * 0.25 + yawScore * 0.25;
  const pct = Math.round(Math.min(100, total * 100));

  const tips: string[] = [];
  if (sizeScore < 0.5) tips.push('Face too small — move closer or crop tighter');
  if (rollScore < 0.6) tips.push('Head tilted — keep it level');
  if (yawScore < 0.6) tips.push('Face turned sideways — look straight at the camera');
  if (confidence < 0.6) tips.push('Photo may be blurry or poorly lit');

  return {
    pct,
    factors: {
      confidence: Math.round(confidence * 100),
      size: Math.round(sizeScore * 100),
      roll: Math.round(rollScore * 100),
      yaw: Math.round(yawScore * 100),
    },
    tips,
  };
}

/**
 * Quick face quality check for the camera viewfinder.
 * Returns whether the face is ready for capture and feedback tips.
 */
export function assessCameraQuality(
  confidence: number,
  faceBox: { x: number; y: number; width: number; height: number },
  frameSize: { width: number; height: number },
  landmarks: Point2D[],
): { ready: boolean; tips: string[]; confidence: number } {
  const vidArea = frameSize.width * frameSize.height;
  const faceArea = faceBox.width * faceBox.height;
  const sizeOk = faceArea / vidArea > 0.04;

  const rEyeC = centroid(landmarks.slice(36, 42));
  const lEyeC = centroid(landmarks.slice(42, 48));
  const tiltDeg = Math.abs(
    Math.atan2(lEyeC.y - rEyeC.y, lEyeC.x - rEyeC.x) * (180 / Math.PI),
  );
  const rollOk = tiltDeg < 15;

  const noseTip = landmarks[30];
  const eyeMidX = (rEyeC.x + lEyeC.x) / 2;
  const yawNormVal = Math.abs(noseTip.x - eyeMidX) / Math.max(1, faceBox.width);
  const yawOk = yawNormVal < 0.12;

  const ready = sizeOk && rollOk && yawOk && confidence > 0.5;

  const tips: string[] = [];
  if (!sizeOk) tips.push('Move closer');
  if (!rollOk) tips.push('Keep head level');
  if (!yawOk) tips.push('Look straight at camera');

  return { ready, tips, confidence };
}
